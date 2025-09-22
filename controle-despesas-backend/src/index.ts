// src/index.ts - Versão com a correção final do BigInt no registro de usuário

import express from 'express';
import mariadb from 'mariadb';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verificarToken, verificarPapel, RequestComUsuario } from './middleware/authMiddleware';
import 'dotenv/config';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { randomBytes } from 'crypto';

// Configurações da conexão com o banco de dados
const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD, 
    database: 'controle_despesas',
    connectionLimit: 5
});


// Nodemailer - Agendamento diário às 8h para verificar contas a vencer
// Função principal que faz a verificação e o envio
async function verificarEVenviarEmailsDeVencimento() {
    console.log('----------------------------------------------------');
    console.log(`[${new Date().toLocaleString('pt-BR')}] Executando verificação de contas a vencer...`);
    let conn;
    try {
        conn = await pool.getConnection();

        // Buscar despesas pendentes com vencimento nos próximos 6 dias
        const sqlDespesas = `
            SELECT fornecedor, valor, vencimento 
            FROM despesas 
            WHERE status = 'Pendente' 
              AND vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
            ORDER BY vencimento ASC
        `;
        const despesasProximas = await conn.query(sqlDespesas);

        // Se não houver despesas, não faz nada
        if (despesasProximas.length === 0) {
            console.log("Nenhuma despesa próxima do vencimento encontrada. Nenhum e-mail enviado.");
            return;
        }

        // Buscar os e-mails dos editores e mestres
        const sqlUsuarios = "SELECT email FROM usuarios WHERE papel IN ('editor', 'mestre')";
        const destinatarios = await conn.query(sqlUsuarios);

        // Se não houver destinatários, não faz nada
        if (destinatarios.length === 0) {
            console.log("Nenhum usuário 'editor' ou 'mestre' encontrado para notificar.");
            return;
        }

        const listaEmails = destinatarios.map((user: { email: string }) => user.email);

        // Montar o corpo do e-mail em HTML
        const htmlEmail = `
            <h1>Alerta de Contas a Vencer</h1>
            <p>Olá! Este é um aviso automático do sistema de Controle de Despesas.</p>
            <p>As seguintes contas estão próximas do vencimento:</p>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>Fornecedor/Título</th>
                        <th>Vencimento</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${despesasProximas.map((d: any) => `
                        <tr>
                            <td>${d.fornecedor}</td>
                            <td>${new Date(d.vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td>${Number(d.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <br>
            <p>Por favor, verifique o sistema para mais detalhes.</p>
        `;

        // Enviar o e-mail
        await transporter.sendMail({
            from: `"Controle de Despesas" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Envia para o e-mail principal (ou pode usar a `listaEmails`)
            bcc: listaEmails.join(','), // Usa BCC (Cópia Oculta) para que os destinatários não vejam os e-mails uns dos outros
            subject: 'Aviso: Contas Próximas do Vencimento',
            html: htmlEmail,
        });

        console.log(`E-mail de alerta enviado com sucesso para ${listaEmails.length} destinatário(s).`);

    } catch (error) {
        console.error("Erro ao executar a tarefa de verificação de e-mails:", error);
    } finally {
        if (conn) conn.release();
    }
}

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Função auxiliar para registrar uma ação no banco de dados de logs.
 * @param acao Descrição da ação realizada.
 * @param usuario_id ID do usuário que realizou a ação.
 * @param despesa_id ID da despesa que foi afetada.
 */

// Limita o número de logs para evitar crescimento descontrolado
async function registrarLog(acao: string, usuario_id: number, despesa_id: number | string | null) {
    let conn;
    const LIMITE_LOGS = 300; // Definimos o limite aqui

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        //Insere o novo log
        const sqlInsert = "INSERT INTO logs (descricao, usuario_id, despesa_id) VALUES (?, ?, ?)";
        await conn.query(sqlInsert, [acao, usuario_id, despesa_id]);
        console.log('Log registrado com sucesso:', acao);

        // Verifica a contagem de logs
        const rows = await conn.query("SELECT COUNT(*) as total FROM logs");
        const totalLogs = Number(rows[0].total);

        // Se a contagem exceder o limite, apaga o mais antigo
        if (totalLogs > LIMITE_LOGS) {
            // Encontra o ID do log mais antigo (ORDER BY data_hora ASC)
            const [logMaisAntigo] = await conn.query("SELECT id FROM logs ORDER BY data_hora ASC LIMIT 1");
            if (logMaisAntigo) {
                await conn.query("DELETE FROM logs WHERE id = ?", [logMaisAntigo.id]);
                console.log(`Limite de logs atingido. Log mais antigo (ID: ${logMaisAntigo.id}) foi apagado.`);
            }
        }

        // Confirma a transação
        await conn.commit();

    } catch (err) {
        // Se algo der errado, desfaz a transação
        if (conn) await conn.rollback();
        console.error("Falha na operação de log:", err);
    } finally {
        if (conn) conn.release();
    }
}

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_padrao_de_emergencia';

app.use(express.json());
app.use(cors());

// Rota de teste
app.get('/', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT 1 as val");
        res.send(`<h1>Conectado ao MariaDB com sucesso!</h1><p>Resultado do teste: ${rows[0].val}</p>`);
    } catch (err) {
        res.status(500).send("<h1>Falha ao conectar com o banco de dados.</h1>");
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para buscar o histórico de uma despesa para o relatório
app.get('/api/despesas/relatorio/:fornecedor', verificarToken, async (req, res) => {
    let { fornecedor } = req.params;
    let conn;

    try {
        conn = await pool.getConnection();

        // Limpa o nome do fornecedor para buscar todas as parcelas/ocorrências
        // Ex: "Conta de Luz (Parcela 1/12)" vira "Conta de Luz"
        const nomeBaseFornecedor = fornecedor.replace(/\s*\((Parcela|Recorrente).*$/, '').trim();

        // Usamos LIKE para pegar todas as despesas que começam com o nome base
        const sql = "SELECT valor, vencimento FROM despesas WHERE fornecedor LIKE ? AND status = 'Pago' ORDER BY vencimento ASC";
        const historico = await conn.query(sql, [`${nomeBaseFornecedor}%`]);

        res.json(historico);

    } catch (err) {
        console.error("Erro ao buscar histórico da despesa:", err);
        res.status(500).json({ error: 'Erro interno ao buscar histórico da despesa.' });
    } finally {
        if (conn) conn.release();
    }
});

// ENDPOINT SOLICITAR REDEFINIÇÃO DE SENHA
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        const [usuario] = await conn.query("SELECT * FROM usuarios WHERE email = ?", [email]);

        // IMPORTANTE: Mesmo que o usuário не seja encontrado, enviamos uma resposta de sucesso
        // para evitar que hackers descubram quais e-mails estão cadastrados.
        if (!usuario) {
            return res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });
        }

        // 1. Gerar um token seguro e aleatório
        const resetToken = randomBytes(32).toString('hex');

        // 2. Salvar o token "hasheado" no banco de dados para segurança (opcional, mas recomendado)
        // Para simplificar, salvaremos o token direto, mas em produção o ideal seria salvar o hash do token.
        // Vamos definir uma expiração de 1 hora.
        const expires = new Date(Date.now() + 3600000); // 1 hora a partir de agora

        const sqlUpdate = "UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE id = ?";
        await conn.query(sqlUpdate, [resetToken, expires, usuario.id]);

        // Enviar o e-mail com o link de redefinição
        // ATENÇÃO: A URL deve apontar para o seu front-end. O padrão do Live Server é 127.0.0.1:5500
        const resetUrl = `http://127.0.0.1:5500/reset-password.html?token=${resetToken}`;
        const htmlEmail = `
            <h1>Redefinição de Senha</h1>
            <p>Olá, ${usuario.nome}.</p>
            <p>Você solicitou uma redefinição de senha. Por favor, clique no link abaixo para criar uma nova senha:</p>
            <a href="${resetUrl}" target="_blank">Redefinir Minha Senha</a>
            <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
            <p>Este link é válido por 1 hora.</p>
        `;

        await transporter.sendMail({
            from: `"Controle de Despesas" <${process.env.EMAIL_USER}>`,
            to: usuario.email,
            subject: 'Link para Redefinição de Senha',
            html: htmlEmail,
        });

        res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição foi enviado.' });

    } catch (err) {
        console.error("Erro em forgot-password:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// ENDPOINT EFETIVAMENTE REDEFINIR A SENHA
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
        return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // Encontra o usuário pelo token E verifica se ele não expirou
        const sqlFind = "SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expires > NOW()";
        const [usuario] = await conn.query(sqlFind, [token]);

        if (!usuario) {
            return res.status(400).json({ error: 'Token inválido ou expirado.' });
        }

        // Se o token é válido, cria o hash da nova senha
        const saltRounds = 10;
        const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

        // Atualiza a senha e NULIFICA o token para que não possa ser usado de novo
        const sqlUpdate = "UPDATE usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?";
        await conn.query(sqlUpdate, [novaSenhaHash, usuario.id]);

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (err) {
        console.error("Erro em reset-password:", err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para o MESTRE excluir um usuário
app.delete('/api/usuarios/:id', verificarToken, verificarPapel(['mestre']), async (req: RequestComUsuario, res) => {
    const idParaExcluir = req.params.id;
    const idDoMestre = req.usuario.id; // ID do usuário logado (o mestre)

    // REGRA DE NEGÓCIO CRÍTICA: Impede que o mestre se auto-delete
    if (idParaExcluir == idDoMestre) {
        return res.status(403).json({ error: 'Ação proibida: um usuário mestre não pode excluir a si mesmo.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const sql = "DELETE FROM usuarios WHERE id = ?";
        const result = await conn.query(sql, [idParaExcluir]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário не encontrado para exclusão.' });
        }

        // ADICIONAR LOG DE EXCLUSÃO DE USUÁRIO ---
        await registrarLog(`Excluiu o usuário ID ${idParaExcluir}`, idDoMestre, null);

        res.status(204).send();

    } catch (err) {
        console.error("Erro ao excluir usuário:", err);
        res.status(500).json({ error: 'Erro interno ao excluir o usuário.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para LER TODOS os logs (apenas para o MESTRE)
app.get('/api/logs', verificarToken, verificarPapel(['mestre']), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Captura os parâmetros da query string (ex: /api/logs?page=2&limit=20)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20; // 20 logs por página como padrão
        const offset = (page - 1) * limit;

        // Busca a contagem total de logs para a paginação no front-end
        const totalResult = await conn.query("SELECT COUNT(*) as total FROM logs");
        const totalLogs = Number(totalResult[0].total);

        // Busca a página específica de logs com JOIN e ordenação
        const sql = `
            SELECT 
                logs.id, logs.descricao, logs.data_hora, 
                usuarios.nome AS nome_usuario 
            FROM logs 
            JOIN usuarios ON logs.usuario_id = usuarios.id 
            ORDER BY logs.data_hora DESC
            LIMIT ? OFFSET ?
        `;

        const logs = await conn.query(sql, [limit, offset]);
        const logsProcessados = logs.map((log: any) => ({ ...log, id: Number(log.id) }));

        // 4. Retorna um objeto estruturado com os logs e informações de paginação
        res.json({
            logs: logsProcessados,
            total: totalLogs,
            page: page,
            limit: limit
        });

    } catch (err) {
        console.error("Erro ao buscar logs:", err);
        res.status(500).json({ error: 'Erro interno ao buscar os logs.' });
    } finally {
        if (conn) conn.release();
    }
});


// Endpoint para o próprio usuário alterar sua senha
app.put('/api/usuarios/alterar-senha', verificarToken, async (req: RequestComUsuario, res) => {
    // Pega os dados do corpo da requisição
    const { senhaAtual, novaSenha } = req.body;

    // Pega o ID do usuário a partir do token JWT (é mais seguro, pois vem do login)
    const idUsuarioLogado = req.usuario.id;

    // Validação básica
    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'A senha atual e a nova senha são obrigatórias.' });
    }
    if (novaSenha.length < 6) { // Regra de negócio simples
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // Busca o usuário no banco para pegar o hash da senha atual
        const [usuario] = await conn.query("SELECT * FROM usuarios WHERE id = ?", [idUsuarioLogado]);

        if (!usuario) {
            // Isso não deveria acontecer se o token for válido, mas é uma boa verificação
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // Compara a senha atual enviada com o hash salvo no banco
        const senhaAtualCorreta = await bcrypt.compare(senhaAtual, usuario.senha_hash);

        if (!senhaAtualCorreta) {
            return res.status(403).json({ error: 'A senha atual está incorreta.' }); // 403 Forbidden
        }

        // Se a senha atual estiver correta, cria um novo hash para a nova senha
        const saltRounds = 10;
        const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

        // Atualiza o banco de dados com o novo hash
        const sql = "UPDATE usuarios SET senha_hash = ? WHERE id = ?";
        await conn.query(sql, [novaSenhaHash, idUsuarioLogado]);

        // Envia a resposta de sucesso
        res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (err) {
        console.error("Erro ao alterar senha:", err);
        res.status(500).json({ error: 'Erro interno ao tentar alterar a senha.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para o MESTRE alterar o papel de um usuário ---
app.put('/api/usuarios/:id/papel', verificarToken, verificarPapel(['mestre']), async (req: RequestComUsuario, res) => {
    const idParaAlterar = req.params.id;
    const { papel } = req.body;
    const idDoMestre = req.usuario.id;

    if (idParaAlterar == idDoMestre) {
        return res.status(403).json({ error: 'Ação proibida: um usuário mestre не pode alterar o próprio papel.' });
    }

    if (!papel || !['mestre', 'editor', 'visualizador'].includes(papel)) {
        return res.status(400).json({ error: 'Papel inválido fornecido.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // Busca o nome do usuário que SERÁ alterado, para usar no log.
        const [usuarioAlvo] = await conn.query("SELECT nome FROM usuarios WHERE id = ?", [idParaAlterar]);
        if (!usuarioAlvo) {
            return res.status(404).json({ error: 'Usuário alvo da alteração não encontrado.' });
        }
        const nomeUsuarioAlvo = usuarioAlvo.nome;

        // Executa a atualização do papel
        const sql = "UPDATE usuarios SET papel = ? WHERE id = ?";
        const result = await conn.query(sql, [papel, idParaAlterar]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para atualização.' });
        }

        // Registra a ação no log com o nome do usuário
        const descricaoLog = `Alterou o papel do usuário "${nomeUsuarioAlvo}" (ID: ${idParaAlterar}) para "${papel}"`;
        await registrarLog(descricaoLog, idDoMestre, null); // despesa_id é null aqui

        res.status(200).json({ message: 'Papel do usuário atualizado com sucesso.' });

    } catch (err) {
        console.error("Erro ao atualizar papel do usuário:", err);
        res.status(500).json({ error: 'Erro interno ao atualizar o papel do usuário.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para LER TODAS as despesas
app.get('/api/despesas', verificarToken, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM despesas ORDER BY vencimento ASC");

        const despesasProcessadas = rows.map((despesa: any) => {
            return { ...despesa, id: Number(despesa.id), valor: parseFloat(despesa.valor) };
        });

        res.json(despesasProcessadas);

    } catch (err) {
        console.error("Erro ao buscar despesas:", err);
        res.status(500).json({ error: 'Erro ao buscar despesas no banco de dados.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para CRIAR uma nova despesa
app.post('/api/despesas', verificarToken, verificarPapel(['editor', 'mestre']), async (req: RequestComUsuario, res) => {
    const {
        fornecedor, valor, vencimento, categoria, periodicidade,
        notaFiscal, situacaoFinanceiro, situacaoFiscal, status,
        numero_parcelas, tem_valor_fixo, valor_fixo
    } = req.body;

    if (!fornecedor || !valor || !vencimento || !categoria || !periodicidade) {
        return res.status(400).json({ error: 'Campos obrigatórios estão faltando.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const usuarioIdLog = (req as RequestComUsuario).usuario.id;

        if (periodicidade === 'Parcelada' && numero_parcelas >= 2) {
            const dataInicial = new Date(vencimento + 'T03:00:00');
            const createdIds = [];
            for (let i = 1; i <= numero_parcelas; i++) {
                const dataParcela = new Date(dataInicial);
                dataParcela.setMonth(dataInicial.getMonth() + (i - 1));
                const vencimentoParcela = dataParcela.toISOString().split('T')[0];
                const fornecedorParcela = `${fornecedor} (Parcela ${i}/${numero_parcelas})`;

                const sql = `
                    INSERT INTO despesas (fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status, total_parcelas, tem_valor_fixo, valor_fixo) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const params = [
                    fornecedorParcela, valor, vencimentoParcela, categoria,
                    'Parcelada', notaFiscal, 'Pendente', 'Pendente', 'Pendente', numero_parcelas,
                    tem_valor_fixo, valor_fixo
                ];
                const result = await conn.query(sql, params);
                const novoId = Number(result.insertId);
                await registrarLog(`Criou a despesa: "${fornecedorParcela}"`, usuarioIdLog, novoId);
                createdIds.push(novoId);
            }
            res.status(201).json({ message: `${numero_parcelas} parcelas criadas com sucesso.`, ids: createdIds });

        } else {
            const sql = `
                INSERT INTO despesas (fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status, tem_valor_fixo, valor_fixo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                fornecedor, valor, vencimento, categoria, periodicidade,
                notaFiscal, situacaoFinanceiro, situacaoFiscal, status,
                tem_valor_fixo, valor_fixo
            ];
            const result = await conn.query(sql, params);
            const novoId = Number(result.insertId);
            await registrarLog(`Criou a despesa: "${fornecedor}"`, usuarioIdLog, novoId);
            res.status(201).json({ id: novoId, ...req.body });
        }
    } catch (err) {
        console.error("Erro ao inserir despesa:", err);
        res.status(500).json({ error: 'Erro ao inserir despesa no banco de dados.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para ATUALIZAR uma despesa existente
app.put('/api/despesas/:id', verificarToken, verificarPapel(['editor', 'mestre']), async (req: RequestComUsuario, res) => {
    const { id } = req.params;
    const dadosAtualizados = req.body;

    if (!dadosAtualizados.fornecedor || !dadosAtualizados.valor || !dadosAtualizados.vencimento) {
        return res.status(400).json({ error: 'Campos obrigatórios estão faltando.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // Busca o estado da despesa ANTES de qualquer alteração
        const [despesaAntiga] = await conn.query("SELECT * FROM despesas WHERE id = ?", [id]);
        if (!despesaAntiga) {
            if (conn) conn.release();
            return res.status(404).json({ error: 'Despesa não encontrada para buscar estado antigo.' });
        }

        const sqlUpdate = `
            UPDATE despesas SET 
            fornecedor = ?, valor = ?, vencimento = ?, categoria = ?, periodicidade = ?, 
            notaFiscal = ?, situacaoFinanceiro = ?, situacaoFiscal = ?, status = ?, 
            total_parcelas = ?, tem_valor_fixo = ?, valor_fixo = ?
            WHERE id = ?
        `;
        const paramsUpdate = [
            dadosAtualizados.fornecedor, dadosAtualizados.valor, dadosAtualizados.vencimento, dadosAtualizados.categoria, dadosAtualizados.periodicidade,
            dadosAtualizados.notaFiscal, dadosAtualizados.situacaoFinanceiro, dadosAtualizados.situacaoFiscal, dadosAtualizados.status,
            dadosAtualizados.total_parcelas, dadosAtualizados.tem_valor_fixo, dadosAtualizados.valor_fixo,
            id
        ];
        const resultUpdate = await conn.query(sqlUpdate, paramsUpdate);

        if (resultUpdate.affectedRows === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada para atualizar.' });
        }

        // Lógica de Logs Detalhados
        const alteracoes: string[] = [];
        if (despesaAntiga.status !== dadosAtualizados.status) alteracoes.push(`Status alterado de '${despesaAntiga.status}' para '${dadosAtualizados.status}'`);
        if (despesaAntiga.situacaoFiscal !== dadosAtualizados.situacaoFiscal) alteracoes.push(`Situação Fiscal alterada de '${despesaAntiga.situacaoFiscal}' para '${dadosAtualizados.situacaoFiscal}'`);
        if (despesaAntiga.situacaoFinanceiro !== dadosAtualizados.situacaoFinanceiro) alteracoes.push(`Situação Financeira alterada de '${despesaAntiga.situacaoFinanceiro}' para '${dadosAtualizados.situacaoFinanceiro}'`);
        if (parseFloat(despesaAntiga.valor) !== parseFloat(dadosAtualizados.valor)) alteracoes.push(`Valor alterado de R$ ${parseFloat(despesaAntiga.valor).toFixed(2)} para R$ ${parseFloat(dadosAtualizados.valor).toFixed(2)}`);
        if (despesaAntiga.fornecedor !== dadosAtualizados.fornecedor) alteracoes.push(`Título alterado de "${despesaAntiga.fornecedor}" para "${dadosAtualizados.fornecedor}"`);
        if (despesaAntiga.categoria !== dadosAtualizados.categoria) {
            alteracoes.push(`Categoria alterada de '${despesaAntiga.categoria}' para '${dadosAtualizados.categoria}'`);
        }
        if (despesaAntiga.periodicidade !== dadosAtualizados.periodicidade) {
            alteracoes.push(`Periodicidade alterada de '${despesaAntiga.periodicidade}' para '${dadosAtualizados.periodicidade}'`);
        }
        if (despesaAntiga.notaFiscal !== dadosAtualizados.notaFiscal) {
            alteracoes.push(`Nota Fiscal alterada de "${despesaAntiga.notaFiscal || 'N/A'}" para "${dadosAtualizados.notaFiscal || 'N/A'}"`);
        }
        let descricaoLog: string;
        if (alteracoes.length > 0) {
            descricaoLog = `Alterou a despesa "${despesaAntiga.fornecedor}" (ID: ${id}): ${alteracoes.join(', ')}`;
        } else {
            descricaoLog = `Revisou/salvou a despesa "${despesaAntiga.fornecedor}" (ID: ${id}) sem alterações significativas`;
        }
        const usuarioIdLog = (req as RequestComUsuario).usuario.id;
        await registrarLog(descricaoLog, usuarioIdLog, id);

        // Lógica de Negócio (após pagamento)
        const foiPagaAgora = despesaAntiga.status === 'Pendente' && dadosAtualizados.status === 'Pago';

        if (foiPagaAgora) {
            // Lógica de Notificação de Valor Fixo
            if (despesaAntiga.tem_valor_fixo && parseFloat(despesaAntiga.valor_fixo) !== parseFloat(dadosAtualizados.valor)) {
                const sqlUsuarios = "SELECT email, nome FROM usuarios WHERE papel IN ('editor', 'mestre')";
                const destinatarios = await conn.query(sqlUsuarios);
                if (destinatarios.length > 0) {
                    const listaEmails = destinatarios.map((user: { email: string }) => user.email);
                    const htmlEmail = `
                        <h1>Alerta de Alteração de Valor Fixo</h1>
                        <p>Olá,</p>
                        <p>A despesa <strong>"${dadosAtualizados.fornecedor}"</strong> foi marcada como paga com um valor diferente do valor fixo registrado.</p>
                        <ul>
                            <li>Valor Fixo Esperado: <strong>${Number(despesaAntiga.valor_fixo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></li>
                            <li>Valor Efetivamente Pago: <strong>${Number(dadosAtualizados.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></li>
                        </ul>
                        <p>A alteração foi realizada pelo usuário: <strong>${(req as RequestComUsuario).usuario.nome}</strong>.</p>
                        <p>Esta é uma notificação automática para fins de auditoria.</p>
                    `;
                    await transporter.sendMail({
                        from: `"Controle de Despesas" <${process.env.EMAIL_USER}>`,
                        bcc: listaEmails.join(','),
                        subject: `Alerta: Valor da despesa "${dadosAtualizados.fornecedor}" foi alterado`,
                        html: htmlEmail,
                    });
                    console.log('E-mail de alerta de valor fixo enviado com sucesso.');
                }
            }

            // Lógica de Criação de Próxima Fatura Recorrente
            const ehRecorrente = despesaAntiga.periodicidade === 'Mensal' || despesaAntiga.periodicidade === 'Anual';
            if (ehRecorrente) {
                const proximaData = new Date(dadosAtualizados.vencimento + 'T03:00:00');
                if (dadosAtualizados.periodicidade === 'Mensal') {
                    proximaData.setMonth(proximaData.getMonth() + 1);
                } else { // Anual
                    proximaData.setFullYear(proximaData.getFullYear() + 1);
                }
                const proximoVencimento = proximaData.toISOString().split('T')[0];
                const fornecedorBase = despesaAntiga.fornecedor.replace(/\s*\((Parcela|Recorrente).*$/, '').trim();

                const sqlInsertProxima = `
                    INSERT INTO despesas (fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status, tem_valor_fixo, valor_fixo) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const paramsInsertProxima = [
                    fornecedorBase,
                    despesaAntiga.valor,
                    proximoVencimento, despesaAntiga.categoria, despesaAntiga.periodicidade,
                    '', 'Pendente', 'Pendente', 'Pendente',
                    despesaAntiga.tem_valor_fixo, despesaAntiga.valor_fixo
                ];
                await conn.query(sqlInsertProxima, paramsInsertProxima);
                console.log('Próxima fatura recorrente criada com sucesso!');
            }
        }
        res.status(200).json({ id: parseInt(id), ...dadosAtualizados });
    } catch (err) {
        console.error("Erro ao atualizar despesa:", err);
        res.status(500).json({ error: 'Erro ao atualizar despesa no banco de dados.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para EXCLUIR uma despesa
app.delete('/api/despesas/:id', verificarToken, verificarPapel(['editor', 'mestre']), async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await pool.getConnection();
        const sql = "DELETE FROM despesas WHERE id = ?";
        const result = await conn.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }

        const usuarioIdLog = (req as RequestComUsuario).usuario.id;
        // Para o log de exclusão, podemos passar o ID da despesa que foi excluída.
        await registrarLog(`Excluiu a despesa ID ${id}`, usuarioIdLog, id);

        res.status(204).send();
    } catch (err) {
        console.error("Erro ao excluir despesa:", err);
        res.status(500).json({ error: 'Erro ao excluir despesa no banco de dados.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para REGISTRAR um novo usuário
app.post('/api/auth/registrar', verificarToken, verificarPapel(['mestre']), async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        const [usuariosExistentes] = await conn.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (usuariosExistentes) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }

        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const sql = "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)";
        const result = await conn.query(sql, [nome, email, senhaHash]);

        // **** A CORREÇÃO FINAL ESTÁ AQUI ****
        const novoId = Number(result.insertId);

        res.status(201).json({
            id: novoId,
            nome: nome,
            email: email,
            message: 'Usuário criado com sucesso!'
        });

    } catch (err) {
        console.error("Erro ao registrar usuário:", err);
        res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para LER TODOS os usuários (apenas para o MESTRE)
app.get('/api/usuarios', verificarToken, verificarPapel(['mestre']), async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Selecionamos o id, nome, email e papel, mas EXCLUÍMOS a senha_hash por segurança.
        const rows = await conn.query("SELECT id, nome, email, papel FROM usuarios");

        // Convertemos os IDs que podem vir como BigInt
        const usuariosProcessados = rows.map((usuario: any) => {
            return { ...usuario, id: Number(usuario.id) };
        });

        res.json(usuariosProcessados);

    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: 'Erro ao buscar usuários no banco de dados.' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para LOGIN de usuário
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        // 1. Procura o usuário pelo e-mail
        const [usuario] = await conn.query("SELECT * FROM usuarios WHERE email = ?", [email]);

        // Se o usuário não for encontrado, NÃO dizemos "usuário não encontrado" por segurança.
        // Apenas retornamos um erro genérico de "credenciais inválidas".
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
        }

        // 2. Compara a senha enviada com o hash salvo no banco
        // A função bcrypt.compare faz isso de forma segura.
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 3. Se a senha está correta, criamos o Token JWT
        const payload = {
            id: usuario.id,
            nome: usuario.nome,
            papel: usuario.papel
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }); // Token expira em 8 horas

        // 4. Enviamos a resposta de sucesso com os dados do usuário e o token
        res.status(200).json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            papel: usuario.papel,
            token: token
        });

    } catch (err) {
        console.error("Erro ao fazer login:", err);
        res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
    } finally {
        if (conn) conn.release();
    }
});

// 3. Agendamento da tarefa (cron job)
// A sintaxe '0 9 * * *' significa: no minuto 0, da hora 9, todos os dias do mês, todos os meses, todos os dias da semana.
cron.schedule('0 9 * * *', verificarEVenviarEmailsDeVencimento, {
    timezone: "America/Sao_Paulo"
});
console.log('Tarefa de verificação de e-mails agendada para todos os dias às 09:00.');


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor back-end rodando na porta http://localhost:${port}`);
});