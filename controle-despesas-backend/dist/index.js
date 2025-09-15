"use strict";
// src/index.ts - Versão com a correção final do BigInt no registro de usuário
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mariadb_1 = __importDefault(require("mariadb"));
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("./middleware/authMiddleware");
require("dotenv/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
const node_cron_1 = __importDefault(require("node-cron"));
// Configurações da conexão com o banco de dados
const pool = mariadb_1.default.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: process.env.DB_PASSWORD, // Lembre-se de usar sua senha
    database: 'controle_despesas',
    connectionLimit: 5
});
//Nodemailer - Agendamento diário às 8h para verificar contas a vencer
//Função principal que faz a verificação e o envio
function verificarEVenviarEmailsDeVencimento() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('----------------------------------------------------');
        console.log(`[${new Date().toLocaleString('pt-BR')}] Executando verificação de contas a vencer...`);
        let conn;
        try {
            conn = yield pool.getConnection();
            // Passo 1: Buscar despesas pendentes com vencimento nos próximos 6 dias
            const sqlDespesas = `
            SELECT fornecedor, valor, vencimento 
            FROM despesas 
            WHERE status = 'Pendente' 
              AND vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 DAY)
            ORDER BY vencimento ASC
        `;
            const despesasProximas = yield conn.query(sqlDespesas);
            // Se não houver despesas, não faz nada
            if (despesasProximas.length === 0) {
                console.log("Nenhuma despesa próxima do vencimento encontrada. Nenhum e-mail enviado.");
                return;
            }
            // Passo 2: Buscar os e-mails dos editores e mestres
            const sqlUsuarios = "SELECT email FROM usuarios WHERE papel IN ('editor', 'mestre')";
            const destinatarios = yield conn.query(sqlUsuarios);
            // Se não houver destinatários, não faz nada
            if (destinatarios.length === 0) {
                console.log("Nenhum usuário 'editor' ou 'mestre' encontrado para notificar.");
                return;
            }
            const listaEmails = destinatarios.map((user) => user.email);
            // Passo 3: Montar o corpo do e-mail em HTML
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
                    ${despesasProximas.map((d) => `
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
            // Passo 4: Enviar o e-mail
            yield transporter.sendMail({
                from: `"Controle de Despesas" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER, // Envia para o e-mail principal (ou pode usar a `listaEmails`)
                bcc: listaEmails.join(','), // Usa BCC (Cópia Oculta) para que os destinatários não vejam os e-mails uns dos outros
                subject: 'Aviso: Contas Próximas do Vencimento',
                html: htmlEmail,
            });
            console.log(`E-mail de alerta enviado com sucesso para ${listaEmails.length} destinatário(s).`);
        }
        catch (error) {
            console.error("Erro ao executar a tarefa de verificação de e-mails:", error);
        }
        finally {
            if (conn)
                conn.release();
        }
    });
}
// Configuração do Nodemailer
const transporter = nodemailer_1.default.createTransport({
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
function registrarLog(acao, usuario_id, despesa_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let conn;
        const LIMITE_LOGS = 300; // Definimos o limite aqui
        try {
            conn = yield pool.getConnection();
            yield conn.beginTransaction();
            // 1. Insere o novo log
            const sqlInsert = "INSERT INTO logs (descricao, usuario_id, despesa_id) VALUES (?, ?, ?)";
            yield conn.query(sqlInsert, [acao, usuario_id, despesa_id]);
            console.log('Log registrado com sucesso:', acao);
            // 2. Verifica a contagem de logs
            const rows = yield conn.query("SELECT COUNT(*) as total FROM logs");
            const totalLogs = Number(rows[0].total);
            // 3. Se a contagem exceder o limite, apaga o mais antigo
            if (totalLogs > LIMITE_LOGS) {
                // Encontra o ID do log mais antigo (ORDER BY data_hora ASC)
                const [logMaisAntigo] = yield conn.query("SELECT id FROM logs ORDER BY data_hora ASC LIMIT 1");
                if (logMaisAntigo) {
                    yield conn.query("DELETE FROM logs WHERE id = ?", [logMaisAntigo.id]);
                    console.log(`Limite de logs atingido. Log mais antigo (ID: ${logMaisAntigo.id}) foi apagado.`);
                }
            }
            // Confirma a transação
            yield conn.commit();
        }
        catch (err) {
            // Se algo der errado, desfaz a transação
            if (conn)
                yield conn.rollback();
            console.error("Falha na operação de log:", err);
        }
        finally {
            if (conn)
                conn.release();
        }
    });
}
const app = (0, express_1.default)();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_padrao_de_emergencia';
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Rota de teste
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let conn;
    try {
        conn = yield pool.getConnection();
        const rows = yield conn.query("SELECT 1 as val");
        res.send(`<h1>Conectado ao MariaDB com sucesso!</h1><p>Resultado do teste: ${rows[0].val}</p>`);
    }
    catch (err) {
        res.status(500).send("<h1>Falha ao conectar com o banco de dados.</h1>");
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para o MESTRE excluir um usuário
app.delete('/api/usuarios/:id', authMiddleware_1.verificarToken, (0, authMiddleware_1.verificarPapel)(['mestre']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const idParaExcluir = req.params.id;
    const idDoMestre = req.usuario.id; // ID do usuário logado (o mestre)
    // REGRA DE NEGÓCIO CRÍTICA: Impede que o mestre se auto-delete
    if (idParaExcluir == idDoMestre) {
        return res.status(403).json({ error: 'Ação proibida: um usuário mestre não pode excluir a si mesmo.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        const sql = "DELETE FROM usuarios WHERE id = ?";
        const result = yield conn.query(sql, [idParaExcluir]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário не encontrado para exclusão.' });
        }
        // ADICIONAR LOG DE EXCLUSÃO DE USUÁRIO ---
        yield registrarLog(`Excluiu o usuário ID ${idParaExcluir}`, idDoMestre, null);
        res.status(204).send();
    }
    catch (err) {
        console.error("Erro ao excluir usuário:", err);
        res.status(500).json({ error: 'Erro interno ao excluir o usuário.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para LER TODOS os logs (apenas para o MESTRE)
app.get('/api/logs', authMiddleware_1.verificarToken, (0, authMiddleware_1.verificarPapel)(['mestre']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let conn;
    try {
        conn = yield pool.getConnection();
        // 1. Captura os parâmetros da query string (ex: /api/logs?page=2&limit=20)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // 20 logs por página como padrão
        const offset = (page - 1) * limit;
        // 2. Busca a contagem total de logs para a paginação no front-end
        const totalResult = yield conn.query("SELECT COUNT(*) as total FROM logs");
        const totalLogs = Number(totalResult[0].total);
        // 3. Busca a página específica de logs com JOIN e ordenação
        const sql = `
            SELECT 
                logs.id, logs.descricao, logs.data_hora, 
                usuarios.nome AS nome_usuario 
            FROM logs 
            JOIN usuarios ON logs.usuario_id = usuarios.id 
            ORDER BY logs.data_hora DESC
            LIMIT ? OFFSET ?
        `;
        const logs = yield conn.query(sql, [limit, offset]);
        const logsProcessados = logs.map((log) => (Object.assign(Object.assign({}, log), { id: Number(log.id) })));
        // 4. Retorna um objeto estruturado com os logs e informações de paginação
        res.json({
            logs: logsProcessados,
            total: totalLogs,
            page: page,
            limit: limit
        });
    }
    catch (err) {
        console.error("Erro ao buscar logs:", err);
        res.status(500).json({ error: 'Erro interno ao buscar os logs.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para o próprio usuário alterar sua senha
app.put('/api/usuarios/alterar-senha', authMiddleware_1.verificarToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Pega os dados do corpo da requisição
    const { senhaAtual, novaSenha } = req.body;
    // 2. Pega o ID do usuário a partir do token JWT (é mais seguro, pois vem do login)
    const idUsuarioLogado = req.usuario.id;
    // 3. Validação básica
    if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ error: 'A senha atual e a nova senha são obrigatórias.' });
    }
    if (novaSenha.length < 6) { // Regra de negócio simples
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        // 4. Busca o usuário no banco para pegar o hash da senha atual
        const [usuario] = yield conn.query("SELECT * FROM usuarios WHERE id = ?", [idUsuarioLogado]);
        if (!usuario) {
            // Isso não deveria acontecer se o token for válido, mas é uma boa verificação
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        // 5. Compara a senha atual enviada com o hash salvo no banco
        const senhaAtualCorreta = yield bcrypt_1.default.compare(senhaAtual, usuario.senha_hash);
        if (!senhaAtualCorreta) {
            return res.status(403).json({ error: 'A senha atual está incorreta.' }); // 403 Forbidden
        }
        // 6. Se a senha atual estiver correta, cria um novo hash para a nova senha
        const saltRounds = 10;
        const novaSenhaHash = yield bcrypt_1.default.hash(novaSenha, saltRounds);
        // 7. Atualiza o banco de dados com o novo hash
        const sql = "UPDATE usuarios SET senha_hash = ? WHERE id = ?";
        yield conn.query(sql, [novaSenhaHash, idUsuarioLogado]);
        // 8. Envia a resposta de sucesso
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    }
    catch (err) {
        console.error("Erro ao alterar senha:", err);
        res.status(500).json({ error: 'Erro interno ao tentar alterar a senha.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para o MESTRE alterar o papel de um usuário ---
app.put('/api/usuarios/:id/papel', authMiddleware_1.verificarToken, (0, authMiddleware_1.verificarPapel)(['mestre']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        conn = yield pool.getConnection();
        // 1. Busca o nome do usuário que SERÁ alterado, para usar no log.
        const [usuarioAlvo] = yield conn.query("SELECT nome FROM usuarios WHERE id = ?", [idParaAlterar]);
        if (!usuarioAlvo) {
            return res.status(404).json({ error: 'Usuário alvo da alteração não encontrado.' });
        }
        const nomeUsuarioAlvo = usuarioAlvo.nome;
        // 2. Executa a atualização do papel
        const sql = "UPDATE usuarios SET papel = ? WHERE id = ?";
        const result = yield conn.query(sql, [papel, idParaAlterar]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado para atualização.' });
        }
        // 3. Registra a ação no log com o nome do usuário
        const descricaoLog = `Alterou o papel do usuário "${nomeUsuarioAlvo}" (ID: ${idParaAlterar}) para "${papel}"`;
        yield registrarLog(descricaoLog, idDoMestre, null); // despesa_id é null aqui
        // --- FIM DA ALTERAÇÃO ---
        res.status(200).json({ message: 'Papel do usuário atualizado com sucesso.' });
    }
    catch (err) {
        console.error("Erro ao atualizar papel do usuário:", err);
        res.status(500).json({ error: 'Erro interno ao atualizar o papel do usuário.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para LER TODAS as despesas
app.get('/api/despesas', authMiddleware_1.verificarToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let conn;
    try {
        conn = yield pool.getConnection();
        const rows = yield conn.query("SELECT * FROM despesas ORDER BY vencimento ASC");
        const despesasProcessadas = rows.map((despesa) => {
            return Object.assign(Object.assign({}, despesa), { id: Number(despesa.id), valor: parseFloat(despesa.valor) });
        });
        res.json(despesasProcessadas);
    }
    catch (err) {
        console.error("Erro ao buscar despesas:", err);
        res.status(500).json({ error: 'Erro ao buscar despesas no banco de dados.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para CRIAR uma nova despesa
app.post('/api/despesas', authMiddleware_1.verificarToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status, numero_parcelas } = req.body;
    if (!fornecedor || !valor || !vencimento || !categoria || !periodicidade) {
        return res.status(400).json({ error: 'Campos obrigatórios estão faltando.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        if (periodicidade === 'Parcelada' && numero_parcelas >= 2) {
            const dataInicial = new Date(vencimento + 'T03:00:00');
            const createdIds = [];
            for (let i = 1; i <= numero_parcelas; i++) {
                const dataParcela = new Date(dataInicial);
                dataParcela.setMonth(dataInicial.getMonth() + (i - 1));
                const vencimentoParcela = dataParcela.toISOString().split('T')[0];
                const sql = `
                    INSERT INTO despesas (fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status, total_parcelas) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const params = [
                    `${fornecedor} (Parcela ${i}/${numero_parcelas})`, valor, vencimentoParcela, categoria,
                    'Parcelada', notaFiscal, 'Pendente', 'Pendente', 'Pendente', numero_parcelas
                ];
                const result = yield conn.query(sql, params);
                const novoId = Number(result.insertId);
                const usuarioIdLog = req.usuario.id;
                yield registrarLog(`Criou a despesa: "${fornecedor}"`, usuarioIdLog, novoId);
                createdIds.push(Number(result.insertId));
            }
            res.status(201).json({ message: `${numero_parcelas} parcelas criadas com sucesso.`, ids: createdIds });
        }
        else {
            const sql = `
                INSERT INTO despesas (fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                fornecedor, valor, vencimento, categoria, periodicidade,
                notaFiscal, situacaoFinanceiro, situacaoFiscal, status
            ];
            const result = yield conn.query(sql, params);
            res.status(201).json(Object.assign({ id: Number(result.insertId) }, req.body));
        }
    }
    catch (err) {
        console.error("Erro ao inserir despesa:", err);
        res.status(500).json({ error: 'Erro ao inserir despesa no banco de dados.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para ATUALIZAR uma despesa existente
app.put('/api/despesas/:id', authMiddleware_1.verificarToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    if (!dadosAtualizados.fornecedor || !dadosAtualizados.valor || !dadosAtualizados.vencimento) {
        return res.status(400).json({ error: 'Campos obrigatórios estão faltando.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        // Primeiro, buscamos o estado da despesa ANTES de qualquer alteração
        const [despesaAntiga] = yield conn.query("SELECT * FROM despesas WHERE id = ?", [id]);
        if (!despesaAntiga) {
            // Se não encontrarmos, liberamos a conexão e retornamos erro
            if (conn)
                conn.release();
            return res.status(404).json({ error: 'Despesa não encontrada para buscar estado antigo.' });
        }
        const sqlUpdate = `
            UPDATE despesas SET 
            fornecedor = ?, valor = ?, vencimento = ?, categoria = ?, periodicidade = ?, 
            notaFiscal = ?, situacaoFinanceiro = ?, situacaoFiscal = ?, status = ?, total_parcelas = ?
            WHERE id = ?
        `;
        const paramsUpdate = [
            dadosAtualizados.fornecedor, dadosAtualizados.valor, dadosAtualizados.vencimento, dadosAtualizados.categoria, dadosAtualizados.periodicidade,
            dadosAtualizados.notaFiscal, dadosAtualizados.situacaoFinanceiro, dadosAtualizados.situacaoFiscal, dadosAtualizados.status, dadosAtualizados.total_parcelas,
            id
        ];
        const resultUpdate = yield conn.query(sqlUpdate, paramsUpdate);
        if (resultUpdate.affectedRows === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada para atualizar.' });
        }
        // LÓGICA DE LOGS DETALHADOS
        const alteracoes = [];
        // 1. Compara o Status
        if (despesaAntiga.status !== dadosAtualizados.status) {
            alteracoes.push(`Status alterado de '${despesaAntiga.status}' para '${dadosAtualizados.status}'`);
        }
        // 2. Compara a Situação Fiscal
        if (despesaAntiga.situacaoFiscal !== dadosAtualizados.situacaoFiscal) {
            alteracoes.push(`Situação Fiscal alterada de '${despesaAntiga.situacaoFiscal}' para '${dadosAtualizados.situacaoFiscal}'`);
        }
        // 3. Compara a Situação Financeira
        if (despesaAntiga.situacaoFinanceiro !== dadosAtualizados.situacaoFinanceiro) {
            alteracoes.push(`Situação Financeira alterada de '${despesaAntiga.situacaoFinanceiro}' para '${dadosAtualizados.situacaoFinanceiro}'`);
        }
        // 4. Compara o Valor (convertendo para número para evitar falsos positivos)
        if (parseFloat(despesaAntiga.valor) !== parseFloat(dadosAtualizados.valor)) {
            alteracoes.push(`Valor alterado de R$ ${parseFloat(despesaAntiga.valor).toFixed(2)} para R$ ${parseFloat(dadosAtualizados.valor).toFixed(2)}`);
        }
        // 5. Compara o Fornecedor/Título
        if (despesaAntiga.fornecedor !== dadosAtualizados.fornecedor) {
            alteracoes.push(`Título alterado de "${despesaAntiga.fornecedor}" para "${dadosAtualizados.fornecedor}"`);
        }
        let descricaoLog;
        if (alteracoes.length > 0) {
            // Se houveram alterações, cria uma descrição detalhada
            descricaoLog = `Alterou a despesa "${despesaAntiga.fornecedor}" (ID: ${id}): ${alteracoes.join(', ')}`;
        }
        else {
            // Se não houver alterações nos campos monitorados, mantém uma mensagem genérica
            descricaoLog = `Revisou/salvou a despesa "${despesaAntiga.fornecedor}" (ID: ${id}) sem alterações significativas`;
        }
        const usuarioIdLog = req.usuario.id;
        yield registrarLog(descricaoLog, usuarioIdLog, id);
        // LÓGICA DE CRIAÇÃO AUTOMÁTICA DA PRÓXIMA FATURA RECORRENTE
        const foiPagaAgora = despesaAntiga.status === 'Pendente' && dadosAtualizados.status === 'Pago';
        const ehRecorrente = dadosAtualizados.periodicidade === 'Mensal' || dadosAtualizados.periodicidade === 'Anual';
        if (foiPagaAgora && ehRecorrente) {
            const proximaData = new Date(dadosAtualizados.vencimento + 'T03:00:00');
            if (dadosAtualizados.periodicidade === 'Mensal') {
                proximaData.setMonth(proximaData.getMonth() + 1);
            }
            else { // Anual
                proximaData.setFullYear(proximaData.getFullYear() + 1);
            }
            const proximoVencimento = proximaData.toISOString().split('T')[0];
            const sqlInsertProxima = `
                INSERT INTO despesas (fornecedor, valor, vencimento, categoria, periodicidade, notaFiscal, situacaoFinanceiro, situacaoFiscal, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const paramsInsertProxima = [
                dadosAtualizados.fornecedor, dadosAtualizados.valor, proximoVencimento, dadosAtualizados.categoria, dadosAtualizados.periodicidade,
                '', 'Pendente', 'Pendente', 'Pendente'
            ];
            yield conn.query(sqlInsertProxima, paramsInsertProxima);
            console.log('Próxima fatura recorrente criada com sucesso!');
        }
        res.status(200).json(Object.assign({ id: parseInt(id) }, dadosAtualizados));
    }
    catch (err) {
        console.error("Erro ao atualizar despesa:", err);
        res.status(500).json({ error: 'Erro ao atualizar despesa no banco de dados.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para EXCLUIR uma despesa
app.delete('/api/despesas/:id', authMiddleware_1.verificarToken, (0, authMiddleware_1.verificarPapel)(['editor', 'mestre']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    let conn;
    try {
        conn = yield pool.getConnection();
        const sql = "DELETE FROM despesas WHERE id = ?";
        const result = yield conn.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
        const usuarioIdLog = req.usuario.id;
        // Para o log de exclusão, podemos passar o ID da despesa que foi excluída.
        yield registrarLog(`Excluiu a despesa ID ${id}`, usuarioIdLog, id);
        res.status(204).send();
    }
    catch (err) {
        console.error("Erro ao excluir despesa:", err);
        res.status(500).json({ error: 'Erro ao excluir despesa no banco de dados.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para REGISTRAR um novo usuário
app.post('/api/auth/registrar', authMiddleware_1.verificarToken, (0, authMiddleware_1.verificarPapel)(['mestre']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        const [usuariosExistentes] = yield conn.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (usuariosExistentes) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }
        const saltRounds = 10;
        const senhaHash = yield bcrypt_1.default.hash(senha, saltRounds);
        const sql = "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)";
        const result = yield conn.query(sql, [nome, email, senhaHash]);
        // **** A CORREÇÃO FINAL ESTÁ AQUI ****
        const novoId = Number(result.insertId);
        res.status(201).json({
            id: novoId,
            nome: nome,
            email: email,
            message: 'Usuário criado com sucesso!'
        });
    }
    catch (err) {
        console.error("Erro ao registrar usuário:", err);
        res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para LER TODOS os usuários (apenas para o MESTRE)
app.get('/api/usuarios', authMiddleware_1.verificarToken, (0, authMiddleware_1.verificarPapel)(['mestre']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let conn;
    try {
        conn = yield pool.getConnection();
        // Selecionamos o id, nome, email e papel, mas EXCLUÍMOS a senha_hash por segurança.
        const rows = yield conn.query("SELECT id, nome, email, papel FROM usuarios");
        // Convertemos os IDs que podem vir como BigInt
        const usuariosProcessados = rows.map((usuario) => {
            return Object.assign(Object.assign({}, usuario), { id: Number(usuario.id) });
        });
        res.json(usuariosProcessados);
    }
    catch (err) {
        console.error("Erro ao buscar usuários:", err);
        res.status(500).json({ error: 'Erro ao buscar usuários no banco de dados.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// Endpoint para LOGIN de usuário
app.post('/api/auth/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        // 1. Procura o usuário pelo e-mail
        const [usuario] = yield conn.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        // Se o usuário não for encontrado, NÃO dizemos "usuário não encontrado" por segurança.
        // Apenas retornamos um erro genérico de "credenciais inválidas".
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
        }
        // 2. Compara a senha enviada com o hash salvo no banco
        // A função bcrypt.compare faz isso de forma segura.
        const senhaCorreta = yield bcrypt_1.default.compare(senha, usuario.senha_hash);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        // 3. Se a senha está correta, criamos o Token JWT
        const payload = {
            id: usuario.id,
            nome: usuario.nome,
            papel: usuario.papel
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '8h' }); // Token expira em 8 horas
        // 4. Enviamos a resposta de sucesso com os dados do usuário e o token
        res.status(200).json({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            papel: usuario.papel,
            token: token
        });
    }
    catch (err) {
        console.error("Erro ao fazer login:", err);
        res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
    }
    finally {
        if (conn)
            conn.release();
    }
}));
// 3. Agendamento da tarefa (cron job)
// A sintaxe '0 9 * * *' significa: no minuto 0, da hora 9, todos os dias do mês, todos os meses, todos os dias da semana.
node_cron_1.default.schedule('0 9 * * *', verificarEVenviarEmailsDeVencimento, {
    timezone: "America/Sao_Paulo"
});
console.log('Tarefa de verificação de e-mails agendada para todos os dias às 09:00.');
// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor back-end rodando na porta http://localhost:${port}`);
});
