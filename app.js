"use strict";
// app.ts (FRONT-END) - Versão COMPLETA E CORRIGIDA a partir do seu backup
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
console.log("app.ts foi carregado e está sendo executado.");
// --- Constantes Globais ---
const API_BASE_URL = 'http://localhost:3000/api';
let meuGrafico = null;
let graficoRelatorio = null;
let despesas = [];
let idEmEdicao = null;
let idParaExcluir = null;
let idUsuarioParaExcluir = null;
let logsPaginaAtual = 1;
const LOGS_POR_PAGINA = 20;
let usuarioLogado = null;
// ---- Seletores de Elementos do DOM ----
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const formLogin = document.getElementById('form-login');
const loginEmailInput = document.getElementById('login-email');
const loginSenhaInput = document.getElementById('login-senha');
const btnLogout = document.getElementById('btn-logout');
const usuarioLogadoSpan = document.getElementById('usuario-logado');
const modalContainer = document.getElementById('modal-container');
const modalExcluirContainer = document.getElementById('modal-excluir-container');
const btnNovaDespesa = document.getElementById('btn-nova-despesa');
const modalTitulo = document.getElementById('modal-titulo');
const btnCancelar = document.getElementById('btn-cancelar');
const formDespesa = document.getElementById('form-despesa');
const fornecedorInput = document.getElementById('fornecedor');
const valorInput = document.getElementById('valor');
const vencimentoInput = document.getElementById('vencimento');
const categoriaInput = document.getElementById('categoria');
const periodicidadeInput = document.getElementById('periodicidade');
const numeroParcelasInput = document.getElementById('numero-parcelas');
const containerParcelas = document.getElementById('container-parcelas');
const notaFiscalInput = document.getElementById('nota-fiscal');
const situacaoFinanceiroInput = document.getElementById('situacao-financeiro');
const situacaoFiscalInput = document.getElementById('situacao-fiscal');
const statusInput = document.getElementById('status');
const tabelaComercialBody = document.getElementById('tabela-comercial');
const tabelaServicosBody = document.getElementById('tabela-servicos');
const tabelaDespesasExtrasBody = document.getElementById('tabela-despesas-extras');
const filtroMesSelect = document.getElementById('filtro-mes');
const filtroAnoInput = document.getElementById('filtro-ano');
const totalComercialSpan = document.getElementById('total-comercial');
const totalServicosSpan = document.getElementById('total-servicos');
const totalDespesasExtrasSpan = document.getElementById('total-despesas-extras');
const totalGeralSpan = document.getElementById('total-geral');
const btnExcluirConfirmar = document.getElementById('btn-excluir-confirmar');
const btnExcluirCancelar = document.getElementById('btn-excluir-cancelar');
const btnGerenciarUsuarios = document.getElementById('btn-gerenciar-usuarios');
const gerenciamentoUsuariosContainer = document.getElementById('gerenciamento-usuarios-container');
const tabelaUsuariosBody = document.getElementById('tabela-usuarios');
const modalPapelContainer = document.getElementById('modal-papel-container');
const formPapel = document.getElementById('form-papel');
const usuarioIdPapelInput = document.getElementById('usuario-id-papel');
const nomeUsuarioPapelSpan = document.getElementById('nome-usuario-papel');
const selectPapel = document.getElementById('select-papel');
const btnPapelCancelar = document.getElementById('btn-papel-cancelar');
const modalRegistrarContainer = document.getElementById('modal-registrar-container');
const formRegistrar = document.getElementById('form-registrar');
const registrarNomeInput = document.getElementById('registrar-nome');
const registrarEmailInput = document.getElementById('registrar-email');
const registrarSenhaInput = document.getElementById('registrar-senha');
const btnRegistrarCancelar = document.getElementById('btn-registrar-cancelar');
const btnAdicionarUsuario = document.getElementById('btn-adicionar-usuario');
const btnAlterarSenha = document.getElementById('btn-alterar-senha');
const modalSenhaContainer = document.getElementById('modal-senha-container');
const formSenha = document.getElementById('form-senha');
const senhaAtualInput = document.getElementById('senha-atual');
const novaSenhaInput = document.getElementById('nova-senha');
const confirmarNovaSenhaInput = document.getElementById('confirmar-nova-senha');
const btnSenhaCancelar = document.getElementById('btn-senha-cancelar');
const btnVerLogs = document.getElementById('btn-ver-logs');
const logsContainer = document.getElementById('logs-container');
const tabelaLogsBody = document.getElementById('tabela-logs');
const btnDashboard = document.getElementById('btn-dashboard');
const modalExcluirUsuarioContainer = document.getElementById('modal-excluir-usuario-container');
const nomeUsuarioExcluirSpan = document.getElementById('nome-usuario-excluir');
const btnExcluirUsuarioCancelar = document.getElementById('btn-excluir-usuario-cancelar');
const btnExcluirUsuarioConfirmar = document.getElementById('btn-excluir-usuario-confirmar');
const logsPaginacaoContainer = document.getElementById('logs-paginacao-container');
const btnLogsAnterior = document.getElementById('btn-logs-anterior');
const btnLogsProximo = document.getElementById('btn-logs-proximo');
const logsPaginacaoInfo = document.getElementById('logs-paginacao-info');
const forgotPasswordLink = document.getElementById('forgot-password-link');
console.log('Elemento do link "Esqueci a senha":', forgotPasswordLink); // <-- Adicionar aqui
const modalForgotPasswordContainer = document.getElementById('modal-forgot-password-container');
console.log('Elemento do modal "Esqueci a senha":', modalForgotPasswordContainer); // <-- E aqui
const formForgotPassword = document.getElementById('form-forgot-password');
const forgotEmailInput = document.getElementById('forgot-email');
const btnForgotCancelar = document.getElementById('btn-forgot-cancelar');
const modalRelatorioContainer = document.getElementById('modal-relatorio-container');
const relatorioTitulo = document.getElementById('relatorio-titulo');
const graficoRelatorioCanvas = document.getElementById('grafico-relatorio-despesa');
const tabelaRelatorioBody = document.getElementById('tabela-relatorio-body');
const btnRelatorioFechar = document.getElementById('btn-relatorio-fechar');
const temValorFixoCheckbox = document.getElementById('tem-valor-fixo');
const containerValorFixo = document.getElementById('container-valor-fixo');
const valorFixoInput = document.getElementById('valor-fixo');
// Seções principais da tela de despesas
const secoesPrincipais = [
    document.getElementById('resumo-container'),
    document.querySelector('.filters-container'),
    document.getElementById('comercial'),
    document.getElementById('servicos'),
    document.getElementById('despesas-extras'),
    document.getElementById('grafico-container')
];
// Função para buscar os dados do relatório no back-end
function fetchRelatorioData(fornecedor) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // encodeURIComponent trata espaços e caracteres especiais no nome do fornecedor para a URL
            const response = yield fetchComToken(`${API_BASE_URL}/despesas/relatorio/${encodeURIComponent(fornecedor)}`);
            if (!response.ok)
                throw new Error('Falha ao buscar dados do relatório.');
            return yield response.json();
        }
        catch (error) {
            console.error(error);
            alert('Não foi possível carregar os dados do relatório.');
            return [];
        }
    });
}
// Função para renderizar o gráfico e a tabela no modal
function renderizarRelatorio(fornecedor, dados) {
    relatorioTitulo.innerText = `Relatório de: ${fornecedor.replace(/\s*\((Parcela|Recorrente).*$/, '').trim()}`;
    // Prepara os dados para o gráfico
    const labels = dados.map(d => new Date(d.vencimento).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }));
    const valores = dados.map(d => parseFloat(d.valor));
    // Renderiza o gráfico
    const ctx = graficoRelatorioCanvas.getContext('2d');
    if (!ctx)
        return;
    if (graficoRelatorio)
        graficoRelatorio.destroy(); // Destrói o gráfico anterior
    graficoRelatorio = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                    label: 'Valor (R$)',
                    data: valores,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
    // Preenche a tabela de histórico
    tabelaRelatorioBody.innerHTML = '';
    dados.forEach(d => {
        const tr = document.createElement('tr');
        const dataFormatada = new Date(d.vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const valorFormatado = Number(d.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        tr.innerHTML = `<td>${dataFormatada}</td><td>${valorFormatado}</td>`;
        tabelaRelatorioBody.appendChild(tr);
    });
}
// --- LÓGICA DE CONTROLE DE UI (LOGIN/APP) ---
function mostrarTelaLogin() {
    loginContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}
// Função para mostrar a tela principal do app
function mostrarTelaApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    // Esconde as telas "especiais"
    gerenciamentoUsuariosContainer.style.display = 'none';
    logsContainer.style.display = 'none';
    // Mostra todas as seções da tela principal de despesas
    secoesPrincipais.forEach(el => {
        if (el) {
            const element = el;
            element.style.display = element.id === 'resumo-container' || element.classList.contains('filters-container') ? 'flex' : 'block';
        }
    });
}
// Nova função para mostrar a tela de gerenciamento de usuários
function mostrarTelaGerenciamentoUsuarios() {
    // Esconde as seções da tela principal
    secoesPrincipais.forEach(el => { if (el)
        el.style.display = 'none'; });
    // Esconde a tela de logs
    logsContainer.style.display = 'none';
    // Mostra apenas a tela de gerenciamento de usuários
    gerenciamentoUsuariosContainer.style.display = 'block';
}
// Adicione esta nova função junto com as outras de navegação
function mostrarTelaLogs() {
    // Esconde as seções da tela principal
    secoesPrincipais.forEach(el => { if (el)
        el.style.display = 'none'; });
    // Esconde a tela de gerenciamento de usuários
    gerenciamentoUsuariosContainer.style.display = 'none';
    // Mostra apenas a tela de logs
    logsContainer.style.display = 'block';
}
// LÓGICA DE MODAIS
function fecharModalPapel() {
    modalPapelContainer.classList.remove('active');
}
// Nova função para fechar o modal de registrar novo usuário
function fecharModalRegistrar() {
    modalRegistrarContainer.classList.remove('active');
}
// Nova função para fechar o modal de alterar senha
function fecharModalSenha() {
    modalSenhaContainer.classList.remove('active');
    formSenha.reset(); // Limpa o formulário
}
//LÓGICA DE AUTENTICAÇÃO
function handleLogin(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        const email = loginEmailInput.value;
        const senha = loginSenhaInput.value;
        try {
            const response = yield fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const data = yield response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Falha no login.');
            }
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('usuarioLogado', JSON.stringify(data));
            usuarioLogado = data;
            mostrarTelaApp();
            atualizarUIComPermissoes();
            yield carregarDespesasDoBackend();
        }
        catch (error) {
            console.error('Erro de login:', error);
            alert(`Erro ao fazer login: ${error.message}`);
        }
    });
}
// Função para fazer logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuarioLogado');
    usuarioLogado = null;
    mostrarTelaLogin();
}
// FUNÇÕES DE API (ENVIANDO O TOKEN)
function fetchComToken(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, options = {}) {
        const token = localStorage.getItem('authToken');
        const headers = Object.assign(Object.assign({ 'Content-Type': 'application/json' }, options.headers), { 'Authorization': `Bearer ${token}` });
        return fetch(url, Object.assign(Object.assign({}, options), { headers }));
    });
}
// FUNÇÕES PRINCIPAIS DA APLICAÇÃO
function carregarDespesasDoBackend() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetchComToken(`${API_BASE_URL}/despesas`);
            if (response.status === 401 || response.status === 403)
                return handleLogout();
            if (!response.ok)
                throw new Error('Falha ao buscar despesas');
            despesas = yield response.json();
            renderizarTabelas();
        }
        catch (error) {
            console.error('Erro ao carregar despesas:', error);
        }
    });
}
// Função para carregar usuários do backend
function carregarUsuariosDoBackend() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetchComToken(`${API_BASE_URL}/usuarios`);
            if (response.status === 401 || response.status === 403)
                return handleLogout();
            if (!response.ok)
                throw new Error('Falha ao buscar usuários');
            const usuarios = yield response.json();
            tabelaUsuariosBody.innerHTML = '';
            usuarios.forEach((usuario) => {
                const tr = document.createElement('tr');
                // --- LÓGICA PARA OS BOTÕES DE AÇÃO ---
                let botoesAcao = '';
                const ehUsuarioLogado = usuarioLogado && usuario.id === usuarioLogado.id;
                if (ehUsuarioLogado) {
                    // Se for a linha do próprio mestre, desabilita o botão de alterar papel
                    botoesAcao = `<button class="btn-editar-usuario" data-id="${usuario.id}" data-nome="${usuario.nome}" disabled>Alterar Papel</button>`;
                }
                else {
                    // Para todos os outros usuários, mostra os dois botões normalmente
                    botoesAcao = `
                    <button class="btn-editar-usuario" data-id="${usuario.id}" data-nome="${usuario.nome}">Alterar Papel</button>
                    <button class="btn-excluir-usuario" data-id="${usuario.id}" data-nome="${usuario.nome}">Excluir</button>
                `;
                }
                tr.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>${usuario.papel}</td>
                <td>
                    ${botoesAcao}
                </td>
            `;
                tabelaUsuariosBody.appendChild(tr);
            });
        }
        catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    });
}
// Função para carregar logs do backend com paginação
function carregarLogsDoBackend() {
    return __awaiter(this, arguments, void 0, function* (pagina = 1) {
        try {
            // Agora passamos a página e o limite na URL
            const response = yield fetchComToken(`${API_BASE_URL}/logs?page=${pagina}&limit=${LOGS_POR_PAGINA}`);
            if (response.status === 401 || response.status === 403)
                return handleLogout();
            if (!response.ok)
                throw new Error('Falha ao buscar logs');
            const data = yield response.json(); // A resposta agora é um objeto { logs, total, ... }
            const logs = data.logs;
            tabelaLogsBody.innerHTML = '';
            logs.forEach((log) => {
                const tr = document.createElement('tr');
                const dataFormatada = new Date(log.data_hora).toLocaleString('pt-BR');
                tr.innerHTML = `<td>${dataFormatada}</td><td>${log.nome_usuario}</td><td>${log.descricao}</td>`;
                tabelaLogsBody.appendChild(tr);
            });
            // Atualiza o estado da paginação
            logsPaginaAtual = data.page;
            const totalPaginas = Math.ceil(data.total / LOGS_POR_PAGINA) || 1;
            // Atualiza a UI da paginação
            logsPaginacaoInfo.innerText = `Página ${logsPaginaAtual} de ${totalPaginas}`;
            btnLogsAnterior.disabled = logsPaginaAtual <= 1;
            btnLogsProximo.disabled = logsPaginaAtual >= totalPaginas;
            logsPaginacaoContainer.style.display = data.total > 0 ? 'flex' : 'none';
        }
        catch (error) {
            console.error('Erro ao carregar logs:', error);
            alert('Não foi possível carregar os logs do sistema.');
        }
    });
}
// LÓGICA DE FORMULÁRIOS E MODAIS
function handleFormSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        if (idEmEdicao !== null && statusInput.value === 'Pago') {
            const despesaOriginal = despesas.find(d => d.id === idEmEdicao);
            if (despesaOriginal && despesaOriginal.tem_valor_fixo) {
                const valorPago = valorInput.valueAsNumber;
                const valorFixo = Number(despesaOriginal.valor_fixo);
                if (valorPago !== valorFixo) {
                    const confirmou = confirm('ATENÇÃO: O valor pago (R$ ' + valorPago.toFixed(2) +
                        ') é diferente do valor fixo cadastrado (R$ ' + valorFixo.toFixed(2) +
                        ').\n\nDeseja continuar? Uma notificação será enviada aos administradores.');
                    if (!confirmou) {
                        return; // Cancela o envio do formulário
                    }
                }
            }
        }
        const dadosForm = {
            fornecedor: fornecedorInput.value,
            valor: valorInput.valueAsNumber,
            vencimento: vencimentoInput.value,
            categoria: categoriaInput.value,
            periodicidade: periodicidadeInput.value,
            notaFiscal: notaFiscalInput.value,
            situacaoFinanceiro: situacaoFinanceiroInput.value,
            situacaoFiscal: situacaoFiscalInput.value,
            status: statusInput.value,
            // --- Adiciona os novos campos ---
            tem_valor_fixo: temValorFixoCheckbox.checked,
            valor_fixo: temValorFixoCheckbox.checked ? valorFixoInput.valueAsNumber : null
        };
        if (dadosForm.periodicidade === 'Parcelada') {
            dadosForm.numero_parcelas = parseInt(numeroParcelasInput.value, 10);
            dadosForm.total_parcelas = parseInt(numeroParcelasInput.value, 10);
        }
        try {
            let response;
            if (idEmEdicao !== null) {
                response = yield fetchComToken(`${API_BASE_URL}/despesas/${idEmEdicao}`, {
                    method: 'PUT',
                    body: JSON.stringify(dadosForm),
                });
            }
            else {
                response = yield fetchComToken(`${API_BASE_URL}/despesas`, {
                    method: 'POST',
                    body: JSON.stringify(dadosForm),
                });
            }
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(errorData.error || 'Falha ao salvar despesa.');
            }
            fecharModal();
            yield carregarDespesasDoBackend();
        }
        catch (error) {
            console.error('Erro ao salvar despesa:', error);
            alert(`Não foi possível salvar a despesa: ${error.message}`);
        }
    });
}
// Função para abrir o modal de nova despesa ou edição
function abrirModal(paraEditar = false, despesa) {
    var _a;
    modalTitulo.innerText = paraEditar ? 'Editar Despesa' : 'Nova Despesa';
    formDespesa.reset();
    if (paraEditar && despesa) {
        idEmEdicao = despesa.id;
        fornecedorInput.value = despesa.fornecedor;
        valorInput.value = Number(despesa.valor).toString();
        vencimentoInput.value = new Date(despesa.vencimento).toISOString().split('T')[0];
        categoriaInput.value = despesa.categoria;
        periodicidadeInput.value = despesa.periodicidade;
        notaFiscalInput.value = despesa.notaFiscal;
        situacaoFinanceiroInput.value = despesa.situacaoFinanceiro;
        situacaoFiscalInput.value = despesa.situacaoFiscal;
        statusInput.value = despesa.status;
        temValorFixoCheckbox.checked = despesa.tem_valor_fixo || false;
        if (temValorFixoCheckbox.checked) {
            containerValorFixo.style.display = 'block';
            valorFixoInput.required = true;
            valorFixoInput.value = ((_a = despesa.valor_fixo) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        }
        else {
            containerValorFixo.style.display = 'none';
            valorFixoInput.required = false;
        }
        const regexParcela = /\(Parcela \d+\/(\d+)\)/;
        const match = despesa.fornecedor.match(regexParcela);
        if (match) {
            const totalParcelas = match[1];
            periodicidadeInput.value = 'Parcelada';
            containerParcelas.style.display = 'block';
            numeroParcelasInput.required = true;
            numeroParcelasInput.value = totalParcelas;
        }
        else {
            containerParcelas.style.display = 'none';
            numeroParcelasInput.required = false;
        }
    }
    else {
        idEmEdicao = null;
        periodicidadeInput.value = 'Unica';
        containerParcelas.style.display = 'none';
        numeroParcelasInput.required = false;
    }
    modalContainer.classList.add('active');
}
// Função para fechar o modal de nova despesa
function fecharModal() {
    modalContainer.classList.remove('active');
    formDespesa.reset();
    idEmEdicao = null;
}
// Função para abrir o modal de confirmação de exclusão
function excluirDespesa(id) {
    idParaExcluir = id;
    modalExcluirContainer.classList.add('active');
}
// Função para confirmar exclusão de despesa
function atualizarUIComPermissoes() {
    if (!usuarioLogado)
        return;
    usuarioLogadoSpan.innerText = `Olá, ${usuarioLogado.nome}`;
    const podeEditar = usuarioLogado.papel === 'editor' || usuarioLogado.papel === 'mestre';
    const ehMestre = usuarioLogado.papel === 'mestre';
    btnNovaDespesa.style.display = podeEditar ? 'inline-block' : 'none';
    document.body.classList.toggle('modo-visualizacao', !podeEditar);
    btnGerenciarUsuarios.style.display = ehMestre ? 'inline-block' : 'none';
    btnVerLogs.style.display = ehMestre ? 'inline-block' : 'none';
}
// Função para inicializar a aplicação
function inicializarApp() {
    const token = localStorage.getItem('authToken');
    const dadosUsuario = localStorage.getItem('usuarioLogado');
    if (token && dadosUsuario) {
        usuarioLogado = JSON.parse(dadosUsuario);
        mostrarTelaApp();
        atualizarUIComPermissoes();
        carregarDespesasDoBackend();
    }
    else {
        mostrarTelaLogin();
    }
}
// Função para renderizar as tabelas de despesas
function renderizarTabelas() {
    tabelaComercialBody.innerHTML = '';
    tabelaServicosBody.innerHTML = '';
    tabelaDespesasExtrasBody.innerHTML = '';
    const mesSelecionado = filtroMesSelect.value;
    const anoSelecionado = filtroAnoInput.value;
    const despesasFiltradas = despesas.filter(despesa => {
        const dataDespesa = new Date(despesa.vencimento);
        const mesDaDespesa = dataDespesa.getUTCMonth() + 1;
        const anoDaDespesa = dataDespesa.getUTCFullYear();
        const filtroMesOk = mesSelecionado === 'todos' || mesDaDespesa.toString() === mesSelecionado;
        const filtroAnoOk = anoSelecionado === '' || anoDaDespesa.toString() === anoSelecionado;
        return filtroMesOk && filtroAnoOk;
    });
    despesasFiltradas.sort((a, b) => {
        if (a.status === 'Pendente' && b.status !== 'Pendente')
            return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente')
            return 1;
        return 0;
    });
    despesasFiltradas.forEach(despesa => {
        var _a;
        const tr = document.createElement('tr');
        tr.className = `status-${((_a = despesa.status) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'pendente'}`;
        tr.dataset.id = despesa.id.toString();
        let botoesAcaoHtml = ''; // Começa sem botões
        if (usuarioLogado && (usuarioLogado.papel === 'editor' || usuarioLogado.papel === 'mestre')) {
            botoesAcaoHtml = `
        <button class="btn-editar">Editar</button>
        <button class="btn-excluir">Excluir</button>
        <button class="btn-relatorio">Relatório</button> `;
        }
        else {
            botoesAcaoHtml = `<button class="btn-relatorio">Relatório</button>`; // Visualizador só vê o relatório
        }
        const valorFormatado = Number(despesa.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dataFormatada = new Date(despesa.vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        tr.innerHTML = `
            <td>${despesa.fornecedor}</td>
            <td>${valorFormatado}</td>
            <td>${dataFormatada}</td>
            <td>${despesa.periodicidade}</td>
            <td>${despesa.notaFiscal || '--'}</td>
            <td>${despesa.situacaoFinanceiro}</td>
            <td>${despesa.situacaoFiscal}</td>
            <td>
                ${botoesAcaoHtml}
            </td>
        `;
        switch (despesa.categoria) {
            case 'comercial':
                tabelaComercialBody.appendChild(tr);
                break;
            case 'servicos':
                tabelaServicosBody.appendChild(tr);
                break;
            case 'despesas-extras':
                tabelaDespesasExtrasBody.appendChild(tr);
                break;
        }
    });
    let totalComercial = 0, totalServicos = 0, totalDespesasExtras = 0;
    despesasFiltradas.forEach(despesa => {
        switch (despesa.categoria) {
            case 'comercial':
                totalComercial += Number(despesa.valor);
                break;
            case 'servicos':
                totalServicos += Number(despesa.valor);
                break;
            case 'despesas-extras':
                totalDespesasExtras += Number(despesa.valor);
                break;
        }
    });
    const totalGeral = totalComercial + totalServicos + totalDespesasExtras;
    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    totalComercialSpan.innerText = formatarMoeda(totalComercial);
    totalServicosSpan.innerText = formatarMoeda(totalServicos);
    totalDespesasExtrasSpan.innerText = formatarMoeda(totalDespesasExtras);
    totalGeralSpan.innerText = formatarMoeda(totalGeral);
    renderizarGrafico();
}
// Função para renderizar o gráfico de despesas
function renderizarGrafico() {
    const anoSelecionado = parseInt(filtroAnoInput.value, 10);
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosComercial = new Array(12).fill(0);
    const dadosServicos = new Array(12).fill(0);
    const dadosExtras = new Array(12).fill(0);
    const despesasDoAno = despesas.filter(d => new Date(d.vencimento).getUTCFullYear() === anoSelecionado);
    despesasDoAno.forEach(despesa => {
        const mes = new Date(despesa.vencimento).getUTCMonth();
        const valor = Number(despesa.valor);
        if (despesa.categoria === 'comercial')
            dadosComercial[mes] += valor;
        else if (despesa.categoria === 'servicos')
            dadosServicos[mes] += valor;
        else if (despesa.categoria === 'despesas-extras')
            dadosExtras[mes] += valor;
    });
    const ctx = document.getElementById('grafico-despesas').getContext('2d');
    if (!ctx)
        return;
    if (meuGrafico)
        meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'line', data: { labels: labels, datasets: [{ label: 'Comercial', data: dadosComercial, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.1 }, { label: 'Serviços', data: dadosServicos, borderColor: 'rgba(255, 206, 86, 1)', backgroundColor: 'rgba(255, 206, 86, 0.2)', fill: true, tension: 0.1 }, { label: 'Desp. Extras', data: dadosExtras, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1 }] }, options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: `Evolução de Despesas - ${anoSelecionado}` } } }
    });
}
// Adicionando os Event Listeners Finais
document.addEventListener('DOMContentLoaded', inicializarApp);
formLogin.addEventListener('submit', handleLogin);
btnLogout.addEventListener('click', handleLogout);
btnNovaDespesa.addEventListener('click', () => abrirModal());
btnCancelar.addEventListener('click', fecharModal);
formDespesa.addEventListener('submit', handleFormSubmit);
filtroMesSelect.addEventListener('change', renderizarTabelas);
filtroAnoInput.addEventListener('change', renderizarTabelas);
btnGerenciarUsuarios.addEventListener('click', () => {
    mostrarTelaGerenciamentoUsuarios();
    carregarUsuariosDoBackend();
});
btnAdicionarUsuario.addEventListener('click', () => {
    formRegistrar.reset();
    modalRegistrarContainer.classList.add('active');
});
btnRegistrarCancelar.addEventListener('click', fecharModalRegistrar);
formRegistrar.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
    event.preventDefault();
    const nome = registrarNomeInput.value;
    const email = registrarEmailInput.value;
    const senha = registrarSenhaInput.value;
    if (!nome || !email || !senha) {
        alert('Todos os campos são obrigatórios.');
        return;
    }
    try {
        const response = yield fetchComToken(`${API_BASE_URL}/auth/registrar`, {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha }),
        });
        const data = yield response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao criar usuário.');
        }
        alert('Novo usuário criado com sucesso!');
        fecharModalRegistrar();
        yield carregarUsuariosDoBackend();
    }
    catch (error) {
        console.error('Erro ao registrar novo usuário:', error);
        alert(`Erro: ${error.message}`);
    }
}));
function handleTabelasClick(event) {
    return __awaiter(this, void 0, void 0, function* () {
        const target = event.target;
        const tr = target.closest('tr');
        if (!tr || !tr.dataset.id)
            return;
        const id = parseInt(tr.dataset.id, 10);
        const despesa = despesas.find(d => d.id === id);
        if (!despesa)
            return;
        if (target.classList.contains('btn-editar')) {
            abrirModal(true, despesa);
        }
        else if (target.classList.contains('btn-excluir')) {
            excluirDespesa(id);
        }
        else if (target.classList.contains('btn-relatorio')) { // --- LÓGICA NOVA ---
            modalRelatorioContainer.classList.add('active');
            // Mostra um "carregando" enquanto busca os dados
            tabelaRelatorioBody.innerHTML = '<tr><td colspan="2">Carregando...</td></tr>';
            const dadosRelatorio = yield fetchRelatorioData(despesa.fornecedor);
            renderizarRelatorio(despesa.fornecedor, dadosRelatorio);
        }
    });
}
tabelaComercialBody.addEventListener('click', handleTabelasClick);
tabelaServicosBody.addEventListener('click', handleTabelasClick);
tabelaDespesasExtrasBody.addEventListener('click', handleTabelasClick);
tabelaUsuariosBody.addEventListener('click', (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const target = event.target;
    const id = target.dataset.id;
    const nome = target.dataset.nome; // Usamos o data-nome que adicionamos
    if (!id || !nome)
        return;
    // Lógica para ALTERAR PAPEL (já existente, com pequena melhoria)
    if (target.classList.contains('btn-editar-usuario')) {
        const usuarioParaEditar = { id: parseInt(id), nome: nome, papel: (((_a = target.closest('tr')) === null || _a === void 0 ? void 0 : _a.children[3].textContent) || 'visualizador') };
        usuarioIdPapelInput.value = usuarioParaEditar.id.toString();
        nomeUsuarioPapelSpan.innerText = usuarioParaEditar.nome;
        selectPapel.value = usuarioParaEditar.papel;
        modalPapelContainer.classList.add('active');
    }
    // Lógica para EXCLUIR USUÁRIO
    if (target.classList.contains('btn-excluir-usuario')) {
        idUsuarioParaExcluir = parseInt(id, 10);
        nomeUsuarioExcluirSpan.innerText = nome; // Mostra o nome no modal
        modalExcluirUsuarioContainer.classList.add('active');
    }
}));
btnPapelCancelar.addEventListener('click', fecharModalPapel);
formPapel.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
    event.preventDefault();
    const id = usuarioIdPapelInput.value;
    const novoPapel = selectPapel.value;
    if (!id)
        return;
    try {
        const response = yield fetchComToken(`${API_BASE_URL}/usuarios/${id}/papel`, {
            method: 'PUT',
            body: JSON.stringify({ papel: novoPapel }),
        });
        if (!response.ok) {
            const errorData = yield response.json();
            throw new Error(errorData.error || 'Falha ao atualizar o papel.');
        }
        alert('Papel do usuário atualizado com sucesso!');
        fecharModalPapel();
        yield carregarUsuariosDoBackend();
    }
    catch (error) {
        console.error('Erro ao atualizar papel:', error);
        alert(`Erro: ${error.message}`);
    }
}));
btnExcluirCancelar.addEventListener('click', () => {
    idParaExcluir = null;
    modalExcluirContainer.classList.remove('active');
});
btnExcluirConfirmar.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    if (idParaExcluir !== null) {
        try {
            const response = yield fetchComToken(`${API_BASE_URL}/despesas/${idParaExcluir}`, { method: 'DELETE' });
            if (!response.ok)
                throw new Error('Falha ao excluir despesa.');
            yield carregarDespesasDoBackend();
        }
        catch (error) {
            console.error('Erro ao excluir despesa:', error);
            alert('Não foi possível excluir a despesa.');
        }
        finally {
            idParaExcluir = null;
            modalExcluirContainer.classList.remove('active');
        }
    }
}));
periodicidadeInput.addEventListener('change', () => {
    if (periodicidadeInput.value === 'Parcelada') {
        containerParcelas.style.display = 'block';
        numeroParcelasInput.required = true;
    }
    else {
        containerParcelas.style.display = 'none';
        numeroParcelasInput.required = false;
    }
});
btnAlterarSenha.addEventListener('click', () => {
    modalSenhaContainer.classList.add('active');
});
// Fecha o modal de alterar senha
btnSenhaCancelar.addEventListener('click', fecharModalSenha);
// Lógica para enviar o formulário de alteração de senha
formSenha.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
    event.preventDefault();
    const senhaAtual = senhaAtualInput.value;
    const novaSenha = novaSenhaInput.value;
    const confirmarNovaSenha = confirmarNovaSenhaInput.value;
    // Validação no front-end
    if (novaSenha !== confirmarNovaSenha) {
        alert('A nova senha e a confirmação não são iguais.');
        return;
    }
    if (novaSenha.length < 6) {
        alert('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }
    try {
        const response = yield fetchComToken(`${API_BASE_URL}/usuarios/alterar-senha`, {
            method: 'PUT',
            body: JSON.stringify({ senhaAtual, novaSenha }),
        });
        const data = yield response.json();
        if (!response.ok) {
            // Usa a mensagem de erro vinda da API
            throw new Error(data.error || 'Falha ao alterar a senha.');
        }
        alert('Senha alterada com sucesso! Por segurança, recomendamos que faça o login novamente.');
        fecharModalSenha();
        // Força o logout e o recarregamento para a tela de login
        handleLogout();
    }
    catch (error) {
        console.error('Erro ao alterar senha:', error);
        alert(`Erro: ${error.message}`);
    }
}));
btnVerLogs.addEventListener('click', () => {
    mostrarTelaLogs();
    carregarLogsDoBackend(1);
});
btnDashboard.addEventListener('click', (event) => {
    event.preventDefault(); // Impede que o '#' apareça na URL
    mostrarTelaApp();
    renderizarTabelas(); // Garante que os dados sejam recarregados e filtrados corretamente
});
btnExcluirUsuarioCancelar.addEventListener('click', () => {
    modalExcluirUsuarioContainer.classList.remove('active');
    idUsuarioParaExcluir = null;
});
btnExcluirUsuarioConfirmar.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    if (idUsuarioParaExcluir === null)
        return;
    try {
        const response = yield fetchComToken(`${API_BASE_URL}/usuarios/${idUsuarioParaExcluir}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = yield response.json();
            throw new Error(errorData.error || 'Falha ao excluir usuário.');
        }
        alert('Usuário excluído com sucesso!');
        yield carregarUsuariosDoBackend(); // Atualiza a lista
    }
    catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert(`Erro: ${error.message}`);
    }
    finally {
        modalExcluirUsuarioContainer.classList.remove('active');
        idUsuarioParaExcluir = null;
    }
}));
btnLogsAnterior.addEventListener('click', () => {
    if (logsPaginaAtual > 1) {
        carregarLogsDoBackend(logsPaginaAtual - 1);
    }
});
btnLogsProximo.addEventListener('click', () => {
    // A lógica de desabilitar o botão já previne isso, mas é uma segurança extra
    carregarLogsDoBackend(logsPaginaAtual + 1);
});
// Abre o modal de "esqueci a senha"
console.log("Adicionando listener de clique ao link..."); // <-- Adicionar aqui
forgotPasswordLink.addEventListener('click', (e) => {
    console.log("LINK FOI CLICADO!"); // <-- Adicionar aqui
    e.preventDefault();
    modalForgotPasswordContainer.classList.add('active');
});
// Fecha o modal
btnForgotCancelar.addEventListener('click', () => {
    modalForgotPasswordContainer.classList.remove('active');
});
// Envia o e-mail de redefinição
formForgotPassword.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
    e.preventDefault();
    const email = forgotEmailInput.value;
    try {
        const response = yield fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            // Se a resposta não for OK (ex: erro 500), lança um erro para o catch.
            throw new Error('O servidor retornou um erro. Tente novamente mais tarde.');
        }
        const data = yield response.json();
        // Mostramos a mesma mensagem sempre, por segurança
        alert(data.message);
        modalForgotPasswordContainer.classList.remove('active');
        formForgotPassword.reset();
    }
    catch (error) {
        console.error('Erro ao solicitar redefinição:', error);
        alert('Ocorreu um erro. Tente novamente.');
    }
}));
btnRelatorioFechar.addEventListener('click', () => {
    modalRelatorioContainer.classList.remove('active');
});
temValorFixoCheckbox.addEventListener('change', () => {
    if (temValorFixoCheckbox.checked) {
        containerValorFixo.style.display = 'block';
        valorFixoInput.required = true;
    }
    else {
        containerValorFixo.style.display = 'none';
        valorFixoInput.required = false;
    }
});
