console.log("app.ts foi carregado e está sendo executado.");

// Detecta se está rodando localmente (localhost ou 127.0.0.1)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL DO SEU BACKEND
// Quando você subir o backend (na Render, Railway, etc), você copia o link que eles te derem e cola ali embaixo.
const URL_PRODUCAO = 'https://COLE_AQUI_O_LINK_DO_SEU_BACKEND_QUANDO_TIVER.com';

// Se for local, usa a porta 3000. 
// Se for produção, usa a URL relativa '/api' (assumindo que front e back estão no mesmo domínio)
// OU você pode colocar a URL do seu backend na nuvem no lugar de '/api'
const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000/api' // No seu PC, usa esse
    : `${URL_PRODUCAO}/api`;       // Na internet, usa o link real

console.log(`Ambiente detectado: ${isLocalhost ? 'Local' : 'Produção'}. API: ${API_BASE_URL}`);

// Função de segurança para prevenir XSS
function escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Interfaces de Tipos
interface Despesa {
    id: number;
    fornecedor: string;
    valor: number;
    vencimento: string;
    categoria: 'comercial' | 'servicos' | 'despesas-extras';
    periodicidade: 'Unica' | 'Mensal' | 'Anual' | 'Parcelada';
    notaFiscal: string;
    situacaoFinanceiro: 'Pendente' | 'Entregue';
    situacaoFiscal: 'Pendente' | 'Entregue';
    status: 'Pendente' | 'Pago';
    total_parcelas?: number;
    tem_valor_fixo?: boolean;
    valor_fixo?: number;
}

// Interface para o usuário logado
interface Usuario {
    id: number;
    nome: string;
    email: string;
    papel: 'mestre' | 'editor' | 'visualizador';
}


// Variáveis de Estado da Aplicação 
declare const Chart: any;
declare const jspdf: any;
let meuGrafico: any = null;
let graficoRelatorio: any = null;
let despesas: Despesa[] = [];
let idEmEdicao: number | null = null;
let idParaExcluir: number | null = null;
let idUsuarioParaExcluir: number | null = null;
let logsPaginaAtual = 1;
const LOGS_POR_PAGINA = 20;
let usuarioLogado: Usuario | null = null;

// Seletores de Elementos do DOM
const btnGerarPdfUnico = document.getElementById('btn-gerar-pdf-unico') as HTMLButtonElement;
const botoesGerarPdfCategoria = document.querySelectorAll('.btn-gerar-pdf-categoria');
const loginContainer = document.getElementById('login-container') as HTMLDivElement;
const appContainer = document.getElementById('app-container') as HTMLDivElement;
const formLogin = document.getElementById('form-login') as HTMLFormElement;
const loginEmailInput = document.getElementById('login-email') as HTMLInputElement;
const loginSenhaInput = document.getElementById('login-senha') as HTMLInputElement;
const btnLogout = document.getElementById('btn-logout') as HTMLButtonElement;
const usuarioLogadoSpan = document.getElementById('usuario-logado') as HTMLSpanElement;
const modalContainer = document.getElementById('modal-container') as HTMLDivElement;
const modalExcluirContainer = document.getElementById('modal-excluir-container') as HTMLDivElement;
const btnNovaDespesa = document.getElementById('btn-nova-despesa') as HTMLButtonElement;
const modalTitulo = document.getElementById('modal-titulo') as HTMLHeadingElement;
const btnCancelar = document.getElementById('btn-cancelar') as HTMLButtonElement;
const formDespesa = document.getElementById('form-despesa') as HTMLFormElement;
const fornecedorInput = document.getElementById('fornecedor') as HTMLInputElement;
const valorInput = document.getElementById('valor') as HTMLInputElement;
const vencimentoInput = document.getElementById('vencimento') as HTMLInputElement;
const categoriaInput = document.getElementById('categoria') as HTMLSelectElement;
const periodicidadeInput = document.getElementById('periodicidade') as HTMLSelectElement;
const numeroParcelasInput = document.getElementById('numero-parcelas') as HTMLInputElement;
const containerParcelas = document.getElementById('container-parcelas') as HTMLDivElement;
const notaFiscalInput = document.getElementById('nota-fiscal') as HTMLInputElement;
const situacaoFinanceiroInput = document.getElementById('situacao-financeiro') as HTMLSelectElement;
const situacaoFiscalInput = document.getElementById('situacao-fiscal') as HTMLSelectElement;
const statusInput = document.getElementById('status') as HTMLSelectElement;
const tabelaComercialBody = document.getElementById('tabela-comercial') as HTMLTableSectionElement;
const tabelaServicosBody = document.getElementById('tabela-servicos') as HTMLTableSectionElement;
const tabelaDespesasExtrasBody = document.getElementById('tabela-despesas-extras') as HTMLTableSectionElement;
const filtroMesSelect = document.getElementById('filtro-mes') as HTMLSelectElement;
const filtroAnoInput = document.getElementById('filtro-ano') as HTMLInputElement;
const totalComercialSpan = document.getElementById('total-comercial') as HTMLSpanElement;
const totalServicosSpan = document.getElementById('total-servicos') as HTMLSpanElement;
const totalDespesasExtrasSpan = document.getElementById('total-despesas-extras') as HTMLSpanElement;
const totalGeralSpan = document.getElementById('total-geral') as HTMLSpanElement;
const btnExcluirConfirmar = document.getElementById('btn-excluir-confirmar') as HTMLButtonElement;
const btnExcluirCancelar = document.getElementById('btn-excluir-cancelar') as HTMLButtonElement;
const btnGerenciarUsuarios = document.getElementById('btn-gerenciar-usuarios') as HTMLButtonElement;
const gerenciamentoUsuariosContainer = document.getElementById('gerenciamento-usuarios-container') as HTMLElement;
const tabelaUsuariosBody = document.getElementById('tabela-usuarios') as HTMLTableSectionElement;
const modalPapelContainer = document.getElementById('modal-papel-container') as HTMLDivElement;
const formPapel = document.getElementById('form-papel') as HTMLFormElement;
const usuarioIdPapelInput = document.getElementById('usuario-id-papel') as HTMLInputElement;
const nomeUsuarioPapelSpan = document.getElementById('nome-usuario-papel') as HTMLSpanElement;
const selectPapel = document.getElementById('select-papel') as HTMLSelectElement;
const btnPapelCancelar = document.getElementById('btn-papel-cancelar') as HTMLButtonElement;
const modalRegistrarContainer = document.getElementById('modal-registrar-container') as HTMLDivElement;
const formRegistrar = document.getElementById('form-registrar') as HTMLFormElement;
const registrarNomeInput = document.getElementById('registrar-nome') as HTMLInputElement;
const registrarEmailInput = document.getElementById('registrar-email') as HTMLInputElement;
const registrarSenhaInput = document.getElementById('registrar-senha') as HTMLInputElement;
const btnRegistrarCancelar = document.getElementById('btn-registrar-cancelar') as HTMLButtonElement;
const btnAdicionarUsuario = document.getElementById('btn-adicionar-usuario') as HTMLButtonElement;
const btnAlterarSenha = document.getElementById('btn-alterar-senha') as HTMLButtonElement;
const modalSenhaContainer = document.getElementById('modal-senha-container') as HTMLDivElement;
const formSenha = document.getElementById('form-senha') as HTMLFormElement;
const senhaAtualInput = document.getElementById('senha-atual') as HTMLInputElement;
const novaSenhaInput = document.getElementById('nova-senha') as HTMLInputElement;
const confirmarNovaSenhaInput = document.getElementById('confirmar-nova-senha') as HTMLInputElement;
const btnSenhaCancelar = document.getElementById('btn-senha-cancelar') as HTMLButtonElement;
const btnVerLogs = document.getElementById('btn-ver-logs') as HTMLButtonElement;
const logsContainer = document.getElementById('logs-container') as HTMLElement;
const tabelaLogsBody = document.getElementById('tabela-logs') as HTMLTableSectionElement;
const btnDashboard = document.getElementById('btn-dashboard') as HTMLAnchorElement;
const modalExcluirUsuarioContainer = document.getElementById('modal-excluir-usuario-container') as HTMLDivElement;
const nomeUsuarioExcluirSpan = document.getElementById('nome-usuario-excluir') as HTMLSpanElement;
const btnExcluirUsuarioCancelar = document.getElementById('btn-excluir-usuario-cancelar') as HTMLButtonElement;
const btnExcluirUsuarioConfirmar = document.getElementById('btn-excluir-usuario-confirmar') as HTMLButtonElement;
const logsPaginacaoContainer = document.getElementById('logs-paginacao-container') as HTMLDivElement;
const btnLogsAnterior = document.getElementById('btn-logs-anterior') as HTMLButtonElement;
const btnLogsProximo = document.getElementById('btn-logs-proximo') as HTMLButtonElement;
const logsPaginacaoInfo = document.getElementById('logs-paginacao-info') as HTMLSpanElement;
const forgotPasswordLink = document.getElementById('forgot-password-link') as HTMLAnchorElement;
console.log('Elemento do link "Esqueci a senha":', forgotPasswordLink);
const modalForgotPasswordContainer = document.getElementById('modal-forgot-password-container') as HTMLDivElement;
console.log('Elemento do modal "Esqueci a senha":', modalForgotPasswordContainer);
const formForgotPassword = document.getElementById('form-forgot-password') as HTMLFormElement;
const forgotEmailInput = document.getElementById('forgot-email') as HTMLInputElement;
const btnForgotCancelar = document.getElementById('btn-forgot-cancelar') as HTMLButtonElement;
const modalRelatorioContainer = document.getElementById('modal-relatorio-container') as HTMLDivElement;
const relatorioTitulo = document.getElementById('relatorio-titulo') as HTMLHeadingElement;
const graficoRelatorioCanvas = document.getElementById('grafico-relatorio-despesa') as HTMLCanvasElement;
const tabelaRelatorioBody = document.getElementById('tabela-relatorio-body') as HTMLTableSectionElement;
const btnRelatorioFechar = document.getElementById('btn-relatorio-fechar') as HTMLButtonElement;
const temValorFixoCheckbox = document.getElementById('tem-valor-fixo') as HTMLInputElement;
const containerValorFixo = document.getElementById('container-valor-fixo') as HTMLDivElement;
const valorFixoInput = document.getElementById('valor-fixo') as HTMLInputElement;

// Seções principais da tela de despesas
const secoesPrincipais = [
    document.getElementById('resumo-container'),
    document.querySelector('.filters-container'),
    document.getElementById('comercial'),
    document.getElementById('servicos'),
    document.getElementById('despesas-extras'),
    document.getElementById('grafico-container')
];



// Lógica de Tema (Dark Mode)
const btnTema = document.getElementById('btn-tema') as HTMLButtonElement;

function alternarTema() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');

    // Atualiza ícone
    btnTema.innerText = isDark ? '☀️' : '🌙';

    // Salva preferência
    localStorage.setItem('temaPreferido', isDark ? 'escuro' : 'claro');
}

// Função para consertar o bug do "dia anterior"
function formatarDataVisual(dataISO: string): string {
    if (!dataISO) return '--';
    // Pega a parte da data (YYYY-MM-DD) e quebra em pedaços
    const partes = dataISO.split('T')[0].split('-');
    // partes[0] = ano, partes[1] = mes, partes[2] = dia
    // Remonta a data string manualmente, ignorando fuso horário
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function carregarTemaInicial() {
    const temaSalvo = localStorage.getItem('temaPreferido');
    // Se salvou escuro OU se não tem salvo mas o sistema do PC é escuro
    const prefereEscuro = temaSalvo === 'escuro' ||
        (!temaSalvo && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (prefereEscuro) {
        document.body.classList.add('dark-mode');
        if (btnTema) btnTema.innerText = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (btnTema) btnTema.innerText = '🌙';
    }
}

// Ativa o botão
if (btnTema) {
    btnTema.addEventListener('click', alternarTema);
}

// Função para buscar os dados do relatório no back-end
async function fetchRelatorioData(fornecedor: string) {
    try {
        // encodeURIComponent trata espaços e caracteres especiais no nome do fornecedor para a URL
        const response = await fetchComToken(`${API_BASE_URL}/despesas/relatorio/${encodeURIComponent(fornecedor)}`);
        if (!response.ok) throw new Error('Falha ao buscar dados do relatório.');
        return await response.json();
    } catch (error) {
        console.error(error);
        alert('Não foi possível carregar os dados do relatório.');
        return [];
    }
}

// Função para renderizar o gráfico e a tabela no modal
function renderizarRelatorio(fornecedor: string, dados: { valor: string, vencimento: string }[]) {
    relatorioTitulo.innerText = `Relatório de: ${fornecedor.replace(/\s*\((Parcela|Recorrente).*$/, '').trim()}`;

    // Prepara os dados para o gráfico
    const labels = dados.map(d => new Date(d.vencimento).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }));
    const valores = dados.map(d => parseFloat(d.valor));

    // Renderiza o gráfico
    const ctx = graficoRelatorioCanvas.getContext('2d');
    if (!ctx) return;
    if (graficoRelatorio) graficoRelatorio.destroy(); // Destrói o gráfico anterior

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

// LÓGICA DE CONTROLE DE UI (LOGIN/APP) 
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
            const element = el as HTMLElement;
            element.style.display = element.id === 'resumo-container' || element.classList.contains('filters-container') ? 'flex' : 'block';
        }
    });
}

// Nova função para mostrar a tela de gerenciamento de usuários
function mostrarTelaGerenciamentoUsuarios() {
    // Esconde as seções da tela principal
    secoesPrincipais.forEach(el => { if (el) (el as HTMLElement).style.display = 'none'; });

    // Esconde a tela de logs
    logsContainer.style.display = 'none';

    // Mostra apenas a tela de gerenciamento de usuários
    gerenciamentoUsuariosContainer.style.display = 'block';
}

// Adicione esta nova função junto com as outras de navegação
function mostrarTelaLogs() {
    // Esconde as seções da tela principal
    secoesPrincipais.forEach(el => { if (el) (el as HTMLElement).style.display = 'none'; });

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
async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    const email = loginEmailInput.value;
    const senha = loginSenhaInput.value;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha no login.');
        }
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('usuarioLogado', JSON.stringify(data));
        usuarioLogado = data;

        configurarFiltrosParaDataAtual();

        mostrarTelaApp();
        atualizarUIComPermissoes();
        await carregarDespesasDoBackend();
    } catch (error: any) {
        console.error('Erro de login:', error);
        alert(`Erro ao fazer login: ${error.message}`);
    }
}

// Função para fazer logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuarioLogado');
    usuarioLogado = null;
    mostrarTelaLogin();
}

// FUNÇÕES DE API (ENVIANDO O TOKEN)
async function fetchComToken(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers });
}

// FUNÇÕES PRINCIPAIS DA APLICAÇÃO
async function carregarDespesasDoBackend() {
    try {
        const response = await fetchComToken(`${API_BASE_URL}/despesas`);
        if (response.status === 401 || response.status === 403) return handleLogout();
        if (!response.ok) throw new Error('Falha ao buscar despesas');
        despesas = await response.json();
        renderizarTabelas();
    } catch (error) {
        console.error('Erro ao carregar despesas:', error);
    }
}

// Função para carregar usuários do backend
async function carregarUsuariosDoBackend() {
    try {
        const response = await fetchComToken(`${API_BASE_URL}/usuarios`);
        if (response.status === 401 || response.status === 403) return handleLogout();
        if (!response.ok) throw new Error('Falha ao buscar usuários');
        const usuarios: Usuario[] = await response.json();

        tabelaUsuariosBody.innerHTML = '';
        usuarios.forEach((usuario: Usuario) => {
            const tr = document.createElement('tr');

            // LÓGICA PARA OS BOTÕES DE AÇÃO 
            let botoesAcao = '';
            const ehUsuarioLogado = usuarioLogado && usuario.id === usuarioLogado.id;

            if (ehUsuarioLogado) {
                // Se for a linha do próprio mestre, desabilita o botão de alterar papel
                botoesAcao = `<button class="btn-editar-usuario" data-id="${usuario.id}" data-nome="${escapeHtml(usuario.nome)}" disabled>Alterar Papel</button>`;
            } else {
                // Para todos os outros usuários, mostra os dois botões normalmente
                botoesAcao = `
                    <button class="btn-editar-usuario" data-id="${usuario.id}" data-nome="${escapeHtml(usuario.nome)}">Alterar Papel</button>
                    <button class="btn-excluir-usuario" data-id="${usuario.id}" data-nome="${escapeHtml(usuario.nome)}">Excluir</button>
                `;
            }

            tr.innerHTML = `
                <td>${usuario.id}</td>
                <td>${escapeHtml(usuario.nome)}</td>   
                <td>${escapeHtml(usuario.email)}</td>  
                <td>${usuario.papel}</td> 
                <td>
                    ${botoesAcao}
                </td>
            `;
            tabelaUsuariosBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

// Função para carregar logs do backend com paginação
async function carregarLogsDoBackend(pagina = 1) {
    try {
        // Agora passamos a página e o limite na URL
        const response = await fetchComToken(`${API_BASE_URL}/logs?page=${pagina}&limit=${LOGS_POR_PAGINA}`);
        if (response.status === 401 || response.status === 403) return handleLogout();
        if (!response.ok) throw new Error('Falha ao buscar logs');

        const data = await response.json(); // A resposta agora é um objeto { logs, total, ... }
        const logs = data.logs;

        tabelaLogsBody.innerHTML = '';
        logs.forEach((log: any) => {
            const tr = document.createElement('tr');
            const dataFormatada = new Date(log.data_hora).toLocaleString('pt-BR');
            tr.innerHTML = `<td>${dataFormatada}</td><td>${escapeHtml(log.nome_usuario)}</td><td>${escapeHtml(log.descricao)}</td>`;
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

    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        alert('Não foi possível carregar os logs do sistema.');
    }
}

function setCarregando(botao: HTMLButtonElement, carregando: boolean, textoOriginal: string = 'Salvar') {
    if (carregando) {
        botao.disabled = true;
        // Adiciona um spinner simples via texto ou HTML
        botao.innerHTML = '⏳ Processando...';
        botao.style.opacity = '0.7';
        botao.style.cursor = 'wait';
    } else {
        botao.disabled = false;
        botao.innerHTML = textoOriginal;
        botao.style.opacity = '1';
        botao.style.cursor = 'pointer';
    }
}

function mostrarToast(mensagem: string, tipo: 'sucesso' | 'erro' | 'info' = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    // Ícones simples para dar um tcham
    let icone = '';
    if (tipo === 'sucesso') icone = '✅';
    if (tipo === 'erro') icone = '❌';
    if (tipo === 'info') icone = 'ℹ️';

    toast.innerHTML = `${icone} &nbsp; ${mensagem}`;

    container.appendChild(toast);

    // Remove o toast automaticamente após 3 segundos
    setTimeout(() => {
        toast.classList.add('hiding'); // Ativa a animação de saída no CSS
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// LÓGICA DE FORMULÁRIOS E MODAIS
async function handleFormSubmit(event: SubmitEvent) {
    event.preventDefault();

    // 1. Captura o botão de salvar dentro deste formulário específico
    const btnSalvar = formDespesa.querySelector('button[type="submit"]') as HTMLButtonElement;

    const dadosForm: any = {
        fornecedor: fornecedorInput.value,
        valor: valorInput.valueAsNumber,
        vencimento: vencimentoInput.value,
        categoria: categoriaInput.value,
        periodicidade: periodicidadeInput.value,
        notaFiscal: notaFiscalInput.value,
        situacaoFinanceiro: situacaoFinanceiroInput.value,
        situacaoFiscal: situacaoFiscalInput.value,
        status: statusInput.value,
        tem_valor_fixo: temValorFixoCheckbox.checked,
        valor_fixo: temValorFixoCheckbox.checked ? valorFixoInput.valueAsNumber : null
    };

    if (dadosForm.periodicidade === 'Parcelada') {
        dadosForm.numero_parcelas = parseInt(numeroParcelasInput.value, 10);
        dadosForm.total_parcelas = parseInt(numeroParcelasInput.value, 10);
    }

    const idParaSalvar = idEmEdicao;

    // Lógica de confirmação de valor fixo
    if (idParaSalvar !== null && statusInput.value === 'Pago') {
        const despesaOriginal = despesas.find(d => d.id === idParaSalvar);
        if (despesaOriginal && despesaOriginal.tem_valor_fixo) {
            const valorPago = dadosForm.valor;
            const valorFixo = Number(despesaOriginal.valor_fixo);
            if (valorPago !== valorFixo) {
                const confirmou = confirm(
                    'ATENÇÃO: O valor pago é diferente do valor fixo.\nDeseja continuar?'
                );
                if (!confirmou) return;
            }
        }
    }

    // ATIVA O LOADING
    setCarregando(btnSalvar, true, 'Salvar');

    try {
        let response;
        if (idParaSalvar !== null) {
            response = await fetchComToken(`${API_BASE_URL}/despesas/${idParaSalvar}`, {
                method: 'PUT',
                body: JSON.stringify(dadosForm),
            });
        } else {
            response = await fetchComToken(`${API_BASE_URL}/despesas`, {
                method: 'POST',
                body: JSON.stringify(dadosForm),
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao salvar despesa.');
        }

        // SUCESSO: Mostra Toast e fecha modal
        mostrarToast('Despesa salva com sucesso!', 'sucesso');
        fecharModal();
        await carregarDespesasDoBackend();

    } catch (error: any) {
        console.error('Erro ao salvar despesa:', error);
        // ERRO: Mostra Toast vermelho
        mostrarToast(`Erro: ${error.message}`, 'erro');
    } finally {
        // SEMPRE DESATIVA O LOADING (seja sucesso ou erro)
        setCarregando(btnSalvar, false, 'Salvar');
    }
}

// Função para abrir o modal de nova despesa ou edição
function abrirModal(paraEditar = false, despesa?: Despesa) {
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
            valorFixoInput.value = despesa.valor_fixo?.toString() || '';
        } else {
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
        } else {
            containerParcelas.style.display = 'none';
            numeroParcelasInput.required = false;
        }
    } else {
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
function excluirDespesa(id: number) {
    idParaExcluir = id;
    modalExcluirContainer.classList.add('active');
}

// Função para confirmar exclusão de despesa
function atualizarUIComPermissoes() {
    if (!usuarioLogado) return;
    usuarioLogadoSpan.innerText = `Olá, ${usuarioLogado.nome}`;
    const podeEditar = usuarioLogado.papel === 'editor' || usuarioLogado.papel === 'mestre';
    const ehMestre = usuarioLogado.papel === 'mestre';
    btnNovaDespesa.style.display = podeEditar ? 'inline-block' : 'none';
    document.body.classList.toggle('modo-visualizacao', !podeEditar);
    btnGerenciarUsuarios.style.display = ehMestre ? 'inline-block' : 'none';
    btnVerLogs.style.display = ehMestre ? 'inline-block' : 'none';

    if (btnGerarPdfUnico) btnGerarPdfUnico.style.display = podeEditar ? 'inline-block' : 'none';
    botoesGerarPdfCategoria.forEach(btn => {
        (btn as HTMLElement).style.display = podeEditar ? 'inline-block' : 'none';
    });

}

function configurarFiltrosParaDataAtual() {
    const dataAtual = new Date();
    const mesAtual = (dataAtual.getMonth() + 1).toString();
    const anoAtual = dataAtual.getFullYear().toString();

    const selectMes = document.getElementById('filtro-mes') as HTMLSelectElement;
    const inputAno = document.getElementById('filtro-ano') as HTMLInputElement;

    if (selectMes) selectMes.value = mesAtual;
    if (inputAno) inputAno.value = anoAtual;

    console.log(`Filtros definidos para: Mês ${mesAtual}, Ano ${anoAtual}`);
}

// Função para inicializar a aplicação
function inicializarApp() {
    // Pega a data de hoje: 26 de Janeiro de 2026
    const dataAtual = new Date();
    const mesAtual = (dataAtual.getMonth() + 1).toString();
    const anoAtual = dataAtual.getFullYear().toString();

    // FORÇA os valores nos elementos do DOM primeiro
    const elMes = document.getElementById('filtro-mes') as HTMLSelectElement;
    const elAno = document.getElementById('filtro-ano') as HTMLInputElement;

    if (elMes) elMes.value = mesAtual;
    if (elAno) elAno.value = anoAtual;

    // ATUALIZA as variáveis globais para que a 'renderizarTabelas' não use lixo
    (filtroMesSelect as any).value = mesAtual;
    (filtroAnoInput as any).value = anoAtual;

    console.log("Sistema sincronizado com a data atual.");

    // Segue com o login
    const token = localStorage.getItem('authToken');
    const dadosUsuario = localStorage.getItem('usuarioLogado');

    if (token && dadosUsuario) {
        usuarioLogado = JSON.parse(dadosUsuario);
        mostrarTelaApp();
        atualizarUIComPermissoes();
        // Aqui o carregar vai chamar o renderizar, que agora lerá 2026
        carregarDespesasDoBackend();
    } else {
        mostrarTelaLogin();
    }
}

// Função para renderizar as tabelas de despesas
// Função para renderizar as tabelas de despesas (CORRIGIDA: SOMA APENAS PAGOS)
function renderizarTabelas() {
    tabelaComercialBody.innerHTML = '';
    tabelaServicosBody.innerHTML = '';
    tabelaDespesasExtrasBody.innerHTML = '';

    const mesSelecionado = filtroMesSelect.value; // ex: "1" ou "todos"
    const anoSelecionado = filtroAnoInput.value;   // ex: "2026"
    const labelTotalGeral = document.querySelector('.total-geral h4') as HTMLElement;
    if (labelTotalGeral) {
        if (mesSelecionado === 'todos') {
            // Se estiver filtrando todos os meses, muda o texto para Ano
            labelTotalGeral.innerText = 'Total Geral do Ano';
        } else {
            // Caso contrário, mantém como Mês
            labelTotalGeral.innerText = 'Total Geral do Mês';
        }
    }
    // --- 1. LÓGICA VISUAL (O que aparece nas linhas da tabela) ---
    let despesasParaTabela = despesas.filter(despesa => {
        const dataDespesa = new Date(despesa.vencimento);
        const mesDaDespesa = dataDespesa.getUTCMonth() + 1;
        const anoDaDespesa = dataDespesa.getUTCFullYear();

        const filtroMesOk = mesSelecionado === 'todos' || mesDaDespesa.toString() === mesSelecionado;
        const filtroAnoOk = anoSelecionado === '' || anoDaDespesa.toString() === anoSelecionado;

        return filtroMesOk && filtroAnoOk;
    });

    // Agrupamento visual para "Todos os Meses"
    if (mesSelecionado === 'todos') {
        const agrupadas: { [key: string]: Despesa } = {};

        despesasParaTabela.forEach(d => {
            const nomeBase = d.fornecedor.replace(/\s*\((Parcela|Recorrente).*$/, '').trim();
            // Prioriza mostrar o item pendente ou o primeiro encontrado
            if (!agrupadas[nomeBase] || (agrupadas[nomeBase].status === 'Pago' && d.status === 'Pendente')) {
                agrupadas[nomeBase] = d;
            }
        });
        despesasParaTabela = Object.keys(agrupadas).map(key => agrupadas[key]);
    }

    // Ordenação
    despesasParaTabela.sort((a, b) => {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
        return 0;
    });

    // Renderização das Linhas (HTML)
    despesasParaTabela.forEach(despesa => {
        const tr = document.createElement('tr');
        tr.className = `status-${despesa.status?.toLowerCase() || 'pendente'}`;
        tr.dataset.id = despesa.id.toString();

        const nomeExibicao = mesSelecionado === 'todos'
            ? despesa.fornecedor.replace(/\s*\((Parcela|Recorrente).*$/, '').trim() + ' (Agrupado)'
            : despesa.fornecedor;

        let botoesAcaoHtml = '';
        if (usuarioLogado && (usuarioLogado.papel === 'editor' || usuarioLogado.papel === 'mestre')) {
            botoesAcaoHtml = `
                <button class="btn-editar">Editar</button>
                <button class="btn-excluir">Excluir</button>
                <button class="btn-relatorio">Relatório</button> `;
        } else {
            botoesAcaoHtml = `<button class="btn-relatorio">Relatório</button>`;
        }

        const valorFormatado = Number(despesa.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dataFormatada = formatarDataVisual(despesa.vencimento);

        tr.innerHTML = `
            <td>${escapeHtml(nomeExibicao)}</td>  
            <td>${valorFormatado}</td>
            <td>${mesSelecionado === 'todos' ? '---' : dataFormatada}</td>
            <td>${despesa.periodicidade}</td>
            <td>${escapeHtml(despesa.notaFiscal || '--')}</td> 
            <td>${despesa.situacaoFinanceiro}</td>
            <td>${despesa.situacaoFiscal}</td>
            <td>${botoesAcaoHtml}</td>
        `;

        switch (despesa.categoria) {
            case 'comercial': tabelaComercialBody.appendChild(tr); break;
            case 'servicos': tabelaServicosBody.appendChild(tr); break;
            case 'despesas-extras': tabelaDespesasExtrasBody.appendChild(tr); break;
        }
    });

    // LÓGICA DE CÁLCULO (Soma Real dos Valores Pagos)
    let totalComercial = 0, totalServicos = 0, totalDespesasExtras = 0;

    despesas.forEach(d => {
        const data = new Date(d.vencimento);
        const mes = data.getUTCMonth() + 1;
        const ano = data.getUTCFullYear();

        // Verifica filtros de data
        const filtroMesOk = mesSelecionado === 'todos' || mes.toString() === mesSelecionado;
        const filtroAnoOk = anoSelecionado === '' || ano.toString() === anoSelecionado;

        // Verifica se está PAGO (Regra Solicitada)
        const estaPago = d.status === 'Pago';

        if (filtroMesOk && filtroAnoOk && estaPago) {
            switch (d.categoria) {
                case 'comercial': totalComercial += Number(d.valor); break;
                case 'servicos': totalServicos += Number(d.valor); break;
                case 'despesas-extras': totalDespesasExtras += Number(d.valor); break;
            }
        }
    });

    // Atualiza os Cards
    const totalGeral = totalComercial + totalServicos + totalDespesasExtras;
    const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    totalComercialSpan.innerText = formatarMoeda(totalComercial);
    totalServicosSpan.innerText = formatarMoeda(totalServicos);
    totalDespesasExtrasSpan.innerText = formatarMoeda(totalDespesasExtras);
    totalGeralSpan.innerText = formatarMoeda(totalGeral);

    renderizarGrafico();
}

// Função para renderizar o gráfico de despesas
function renderizarGrafico() {
    const anoSelecionado = parseInt(filtroAnoInput.value, 10);
    if (isNaN(anoSelecionado)) return;
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosComercial = new Array(12).fill(0);
    const dadosServicos = new Array(12).fill(0);
    const dadosExtras = new Array(12).fill(0);
    const despesasDoAno = despesas.filter(d => new Date(d.vencimento).getUTCFullYear() === anoSelecionado);
    despesasDoAno.forEach(despesa => {
        const mes = new Date(despesa.vencimento).getUTCMonth();
        const valor = Number(despesa.valor);
        if (despesa.categoria === 'comercial') dadosComercial[mes] += valor;
        else if (despesa.categoria === 'servicos') dadosServicos[mes] += valor;
        else if (despesa.categoria === 'despesas-extras') dadosExtras[mes] += valor;
    });
    const ctx = (document.getElementById('grafico-despesas') as HTMLCanvasElement).getContext('2d');
    if (!ctx) return;
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Infraestrutura', data: dadosComercial, borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.1 },
                { label: 'Licenças de Software', data: dadosServicos, borderColor: 'rgba(255, 206, 86, 1)', backgroundColor: 'rgba(255, 206, 86, 0.2)', fill: true, tension: 0.1 },
                { label: 'Desp. Extras', data: dadosExtras, borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.1 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: `Evolução de Despesas - ${anoSelecionado}` } } }
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
formRegistrar.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nome = registrarNomeInput.value;
    const email = registrarEmailInput.value;
    const senha = registrarSenhaInput.value;
    if (!nome || !email || !senha) {
        alert('Todos os campos são obrigatórios.');
        return;
    }
    try {
        const response = await fetchComToken(`${API_BASE_URL}/auth/registrar`, {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Falha ao criar usuário.');
        }
        alert('Novo usuário criado com sucesso!');
        fecharModalRegistrar();
        await carregarUsuariosDoBackend();
    } catch (error: any) {
        console.error('Erro ao registrar novo usuário:', error);
        alert(`Erro: ${error.message}`);
    }
});

async function handleTabelasClick(event: MouseEvent) { // Adicionado async
    const target = event.target as HTMLElement;
    const tr = target.closest('tr');
    if (!tr || !tr.dataset.id) return;

    const id = parseInt(tr.dataset.id, 10);
    const despesa = despesas.find(d => d.id === id);
    if (!despesa) return;

    if (target.classList.contains('btn-editar')) {
        abrirModal(true, despesa);
    } else if (target.classList.contains('btn-excluir')) {
        excluirDespesa(id);
    } else if (target.classList.contains('btn-relatorio')) {
        modalRelatorioContainer.classList.add('active');
        // Mostra um "carregando" enquanto busca os dados
        tabelaRelatorioBody.innerHTML = '<tr><td colspan="2">Carregando...</td></tr>';
        const dadosRelatorio = await fetchRelatorioData(despesa.fornecedor);
        renderizarRelatorio(despesa.fornecedor, dadosRelatorio);
    }
}

tabelaComercialBody.addEventListener('click', handleTabelasClick);
tabelaServicosBody.addEventListener('click', handleTabelasClick);
tabelaDespesasExtrasBody.addEventListener('click', handleTabelasClick);
tabelaUsuariosBody.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const id = target.dataset.id;
    const nome = target.dataset.nome; // Usamos o data-nome que adicionamos

    if (!id || !nome) return;

    // Lógica para ALTERAR PAPEL (já existente, com pequena melhoria)
    if (target.classList.contains('btn-editar-usuario')) {
        const usuarioParaEditar = { id: parseInt(id), nome: nome, papel: (target.closest('tr')?.children[3].textContent || 'visualizador') as Usuario['papel'] };
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
});
btnPapelCancelar.addEventListener('click', fecharModalPapel);
formPapel.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = usuarioIdPapelInput.value;
    const novoPapel = selectPapel.value;
    if (!id) return;
    try {
        const response = await fetchComToken(`${API_BASE_URL}/usuarios/${id}/papel`, {
            method: 'PUT',
            body: JSON.stringify({ papel: novoPapel }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao atualizar o papel.');
        }
        alert('Papel do usuário atualizado com sucesso!');
        fecharModalPapel();
        await carregarUsuariosDoBackend();
    } catch (error: any) {
        console.error('Erro ao atualizar papel:', error);
        alert(`Erro: ${error.message}`);
    }
});
btnExcluirCancelar.addEventListener('click', () => {
    idParaExcluir = null;
    modalExcluirContainer.classList.remove('active');
});
btnExcluirConfirmar.addEventListener('click', async () => {
    if (idParaExcluir !== null) {
        try {
            const response = await fetchComToken(`${API_BASE_URL}/despesas/${idParaExcluir}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Falha ao excluir despesa.');
            await carregarDespesasDoBackend();
        } catch (error) {
            console.error('Erro ao excluir despesa:', error);
            alert('Não foi possível excluir a despesa.');
        } finally {
            idParaExcluir = null;
            modalExcluirContainer.classList.remove('active');
        }
    }
});
periodicidadeInput.addEventListener('change', () => {
    if (periodicidadeInput.value === 'Parcelada') {
        containerParcelas.style.display = 'block';
        numeroParcelasInput.required = true;
    } else {
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
formSenha.addEventListener('submit', async (event) => {
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
        const response = await fetchComToken(`${API_BASE_URL}/usuarios/alterar-senha`, {
            method: 'PUT',
            body: JSON.stringify({ senhaAtual, novaSenha }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Usa a mensagem de erro vinda da API
            throw new Error(data.error || 'Falha ao alterar a senha.');
        }

        alert('Senha alterada com sucesso! Por segurança, recomendamos que faça o login novamente.');
        fecharModalSenha();

        // Força o logout e o recarregamento para a tela de login
        handleLogout();

    } catch (error: any) {
        console.error('Erro ao alterar senha:', error);
        alert(`Erro: ${error.message}`);
    }
});

async function validarEGerarPDF(tipoRelatorio: string, alvo: string, dadosTabela: any[], colunas: string[], imagemBase64Injetar: string | null = null) {
    try {
        const response = await fetchComToken(`${API_BASE_URL}/relatorios/log-geracao`, {
            method: 'POST',
            body: JSON.stringify({ tipoRelatorio, alvo })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Sem permissão para gerar relatório.');
        }

        const infoSeguranca = await response.json();
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();

        // Cabeçalhos
        doc.setFontSize(16);
        doc.text(`Relatório de Despesas: ${alvo}`, 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Documento gerado sob supervisão do sistema.`, 14, 30);
        doc.text(`Responsável: ${infoSeguranca.geradoPor}`, 14, 36);
        doc.text(`Data e Hora: ${infoSeguranca.dataGeracao}`, 14, 42);

        let startYParaTabela = 50;

        // INJEÇÃO DIRETA DO BASE64 
        if (imagemBase64Injetar) {
            doc.addImage(imagemBase64Injetar, 'PNG', 14, 50, 180, 60);
            startYParaTabela = 120; // Empurra a tabela para baixo para não sobrepor a imagem
        }

        doc.autoTable({
            startY: startYParaTabela,
            head: [colunas],
            body: dadosTabela,
            theme: 'striped',
            styles: { fontSize: 9 }
        });

        doc.save(`Relatorio_${alvo.replace(/\s+/g, '_')}.pdf`);
        mostrarToast('PDF exportado e ação registrada no log!', 'sucesso');

    } catch (error: any) {
        console.error(error);
        mostrarToast(`Erro: ${error.message}`, 'erro');
    }
}

botoesGerarPdfCategoria.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const categoria = (e.target as HTMLElement).dataset.categoria;

        let idTabela = '';
        let datasetIndex = 0;
        if (categoria === 'comercial') { idTabela = 'tabela-comercial'; datasetIndex = 0; }
        else if (categoria === 'servicos') { idTabela = 'tabela-servicos'; datasetIndex = 1; }
        else if (categoria === 'despesas-extras') { idTabela = 'tabela-despesas-extras'; datasetIndex = 2; }

        const tabelaBody = document.getElementById(idTabela);
        if (!tabelaBody) return;

        const linhas = Array.from(tabelaBody.querySelectorAll('tr'));
        const dados = linhas.map(tr => {
            const tds = tr.querySelectorAll('td');
            const status = tr.classList.contains('status-pago') ? 'Pago' : 'Pendente';
            return [tds[0].innerText, tds[1].innerText, tds[2].innerText, status];
        });

        let imagemBase64 = null;
        if (meuGrafico) {
            // Oculta todos os datasets temporariamente, deixando só a categoria certa
            meuGrafico.data.datasets.forEach((ds: any, index: number) => {
                ds.hidden = (index !== datasetIndex);
            });
            meuGrafico.update('none'); // Renderiza instantaneamente sem animação

            imagemBase64 = meuGrafico.toBase64Image();

            // Restaura o gráfico original para o usuário ver tudo normal
            meuGrafico.data.datasets.forEach((ds: any) => {
                ds.hidden = false;
            });
            meuGrafico.update('none');
        }

        validarEGerarPDF('Visão Geral', categoria!.toUpperCase(), dados, ['Fornecedor', 'Valor', 'Vencimento', 'Status'], imagemBase64);
    });
});

// PDF da Conta Específica
if (btnGerarPdfUnico) {
    btnGerarPdfUnico.addEventListener('click', () => {
        const fornecedor = relatorioTitulo.innerText.replace('Relatório de: ', '');

        const linhas = Array.from(tabelaRelatorioBody.querySelectorAll('tr'));
        const dados = linhas.map(tr => {
            const tds = tr.querySelectorAll('td');
            return [tds[0].innerText, tds[1].innerText];
        });

        const imagemBase64 = graficoRelatorio ? graficoRelatorio.toBase64Image() : null;

        validarEGerarPDF('Conta Específica', fornecedor, dados, ['Vencimento', 'Valor Pago'], imagemBase64);
    });
}

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

// Lógica de confirmação de exclusão de usuário (COM LOADING)
btnExcluirUsuarioConfirmar.addEventListener('click', async () => {
    if (idUsuarioParaExcluir === null) return;

    // Ativa o Loading e trava o botão
    setCarregando(btnExcluirUsuarioConfirmar, true, 'Confirmar Exclusão');

    try {
        const response = await fetchComToken(`${API_BASE_URL}/usuarios/${idUsuarioParaExcluir}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao excluir usuário.');
        }

        // Toast verde + Atualizar lista
        mostrarToast('Usuário excluído com sucesso!', 'sucesso');
        await carregarUsuariosDoBackend();

        // Fecha o modal apenas se deu certo
        modalExcluirUsuarioContainer.classList.remove('active');
        idUsuarioParaExcluir = null;

    } catch (error: any) {
        console.error('Erro ao excluir usuário:', error);
        // Erro = Toast vermelho (Não fecha o modal para a pessoa tentar de novo se quiser)
        mostrarToast(`Erro: ${error.message}`, 'erro');
    } finally {
        // Sempre destrava o botão no final
        setCarregando(btnExcluirUsuarioConfirmar, false, 'Confirmar Exclusão');
    }
});

btnLogsAnterior.addEventListener('click', () => {
    if (logsPaginaAtual > 1) {
        carregarLogsDoBackend(logsPaginaAtual - 1);
    }
});

btnLogsProximo.addEventListener('click', () => {
    // A lógica de desabilitar o botão
    carregarLogsDoBackend(logsPaginaAtual + 1);
});

// Abre o modal de "esqueci a senha"
console.log("Adicionando listener de clique ao link...");
forgotPasswordLink.addEventListener('click', (e) => {
    console.log("LINK FOI CLICADO!");
    e.preventDefault();
    modalForgotPasswordContainer.classList.add('active');
});

// Fecha o modal
btnForgotCancelar.addEventListener('click', () => {
    modalForgotPasswordContainer.classList.remove('active');
});

// Envia o e-mail de redefinição
formForgotPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotEmailInput.value;
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            // Se a resposta não for OK (ex: erro 500), lança um erro para o catch.
            throw new Error('O servidor retornou um erro. Tente novamente mais tarde.');
        }
        const data = await response.json();
        // Mostramos a mesma mensagem sempre, por segurança
        alert(data.message);
        modalForgotPasswordContainer.classList.remove('active');
        formForgotPassword.reset();
    } catch (error) {
        console.error('Erro ao solicitar redefinição:', error);
        alert('Ocorreu um erro. Tente novamente.');
    }
});

btnRelatorioFechar.addEventListener('click', () => {
    modalRelatorioContainer.classList.remove('active');
});

temValorFixoCheckbox.addEventListener('change', () => {
    if (temValorFixoCheckbox.checked) {
        containerValorFixo.style.display = 'block';
        valorFixoInput.required = true;
    } else {
        containerValorFixo.style.display = 'none';
        valorFixoInput.required = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    carregarTemaInicial(); // Carrega o tema antes de tudo
    inicializarApp();
});