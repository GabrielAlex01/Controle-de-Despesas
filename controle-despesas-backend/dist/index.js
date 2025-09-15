"use strict";
// src/index.ts (Back-end) - Versão com a correção final do BigInt nas parcelas
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
// Configurações da conexão com o banco de dados
const pool = mariadb_1.default.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Baiano7530', // SENHA DATABASE
    database: 'controle_despesas',
    connectionLimit: 5
});
const app = (0, express_1.default)();
const port = 3000;
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
// Endpoint para LER TODAS as despesas
app.get('/api/despesas', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post('/api/despesas', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                // **** A CORREÇÃO PRINCIPAL ESTÁ AQUI ****
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
app.put('/api/despesas/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    if (!dadosAtualizados.fornecedor || !dadosAtualizados.valor || !dadosAtualizados.vencimento) {
        return res.status(400).json({ error: 'Campos obrigatórios estão faltando.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        const [despesaAntiga] = yield conn.query("SELECT * FROM despesas WHERE id = ?", [id]);
        if (!despesaAntiga) {
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
app.delete('/api/despesas/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    let conn;
    try {
        conn = yield pool.getConnection();
        const sql = "DELETE FROM despesas WHERE id = ?";
        const result = yield conn.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Despesa não encontrada.' });
        }
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
// --- NOVO: Endpoint para REGISTRAR um novo usuário ---
app.post('/api/auth/registrar', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, email, senha } = req.body;
    // 1. Validação básica dos dados recebidos
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    let conn;
    try {
        conn = yield pool.getConnection();
        // 2. Verifica se o e-mail já existe no banco
        const [usuariosExistentes] = yield conn.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (usuariosExistentes) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' }); // 409 Conflict
        }
        // 3. Criptografa a senha com bcrypt
        const saltRounds = 10; // Fator de "custo" da criptografia
        const senhaHash = yield bcrypt_1.default.hash(senha, saltRounds);
        // 4. Insere o novo usuário no banco de dados
        const sql = "INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)";
        const result = yield conn.query(sql, [nome, email, senhaHash]);
        // 5. Envia uma resposta de sucesso
        res.status(201).json({
            id: result.insertId,
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
// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor back-end rodando na porta http://localhost:${port}`);
});
