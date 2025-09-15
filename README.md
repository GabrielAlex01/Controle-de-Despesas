# Sistema de Controle de Despesas

![Status do Projeto](https://img.shields.io/badge/status-concluído-green)
![Licença](https://img.shields.io/badge/license-MIT-blue)

## 📖 Sobre o Projeto

O **Sistema de Controle de Despesas** é uma aplicação Full Stack desenvolvida para automatizar e otimizar o gerenciamento de contas e faturas do departamento de T.I. O projeto nasceu da necessidade de substituir um processo manual e suscetível a erros, baseado em planilhas de Excel, por uma solução centralizada, segura e inteligente.

A aplicação permite o controle detalhado de despesas fixas, serviços e gastos extras, com um sistema de autenticação robusto e controle de acesso baseado em papéis, além de funcionalidades de automação e visualização de dados.

## ✨ Funcionalidades Principais

* **Gestão Completa de Despesas:** CRUD (Criar, Ler, Atualizar, Excluir) completo para todas as despesas.
* **Dashboard Interativo:** Painel com resumo de totais mensais por categoria e um gráfico de linhas para análise de tendências de gastos ao longo do ano.
* **Automação Inteligente:**
    * Geração automática da próxima fatura para despesas recorrentes (mensais/anuais) após o pagamento.
    * Criação automática de múltiplas faturas para compras parceladas.
* **Sistema de Login Seguro:** Autenticação de usuários com sessões controladas por Tokens JWT.
* **Controle de Acesso por Papéis (RBAC):** Hierarquia de permissões com 3 níveis:
    * `mestre`: Controle total sobre despesas e gerenciamento de usuários.
    * `editor`: Controle total sobre despesas.
    * `visualizador`: Apenas visualização das despesas.
* **Gerenciamento de Usuários:** Painel administrativo para o "Mestre" criar, excluir e alterar o papel de outros usuários.
* **Auditoria e Logs:** Registro automático de alterações importantes realizadas nas despesas, com informação de qual usuário realizou a ação e quando.
* **Notificações por E-mail:** Serviço automatizado que verifica diariamente as contas a vencer e envia e-mails de alerta para os usuários responsáveis.

## 🛡️ Foco em Cibersegurança

A segurança foi um pilar central no desenvolvimento da aplicação. As seguintes camadas e medidas foram implementadas para garantir a proteção dos dados e a integridade do sistema:

* **Gerenciamento de Segredos com Variáveis de Ambiente (`.env`):** Credenciais críticas (senha do banco, segredo JWT, credenciais de e-mail) são mantidas fora do código-fonte, em um arquivo `.env` local. Este arquivo é excluído do controle de versão (`.gitignore`), garantindo que segredos nunca sejam expostos em repositórios de código.
* **Criptografia de Senhas com `bcrypt`:** As senhas dos usuários nunca são armazenadas em texto puro. Utilizamos o algoritmo `bcrypt`, o padrão da indústria, para gerar um *hash* seguro e com "sal" de cada senha, que é o que fica armazenado no banco de dados. A verificação no login é feita comparando o hash da senha fornecida com o hash armazenado, sem nunca expor a senha original.
* **Autenticação via Token JWT (JSON Web Token):** Após o login, o usuário recebe um token JWT assinado digitalmente com o segredo do servidor. Para cada requisição a endpoints protegidos, este token deve ser enviado, provando a identidade do usuário.
* **Middlewares de Segurança em Camadas:** O acesso aos endpoints da API é controlado por uma cadeia de middlewares que funcionam como "porteiros" sequenciais:
    1.  **`verificarToken` (Autenticação):** O primeiro porteiro verifica se um token JWT válido foi enviado no cabeçalho da requisição. Se o token não existir, for inválido ou tiver expirado, o acesso é imediatamente bloqueado.
    2.  **`verificarPapel` (Autorização):** Uma vez que a identidade do usuário é confirmada, o segundo porteiro verifica seu "cargo" (`papel`: mestre, editor, etc.). Cada endpoint crítico possui uma lista de papéis autorizados, e se o usuário não tiver o cargo necessário, seu acesso é bloqueado com uma mensagem de "permissão negada".
* **Prevenção de SQL Injection:** Todas as interações com o banco de dados MariaDB são realizadas através de **consultas parametrizadas**. Isso impede que dados maliciosos inseridos por um usuário sejam executados como comandos SQL, neutralizando um dos vetores de ataque mais comuns e perigosos.
* **Regras de Negócio Seguras:** Foram implementadas lógicas no back-end para prevenir ações que poderiam comprometer o sistema, como impedir que um usuário `mestre` possa excluir ou rebaixar a si mesmo, garantindo a continuidade da administração da ferramenta.

## 🛠️ Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3, TypeScript
* **Back-end:** Node.js, Express.js, TypeScript
* **Banco de Dados:** MariaDB
* **Segurança:** JSON Web Token (JWT), bcrypt e Middleware
* **Automação de E-mails:** Nodemailer, node-cron

## 🚀 Tutorial de Instalação e Execução

Siga este passo a passo para configurar e rodar o projeto em um novo ambiente de desenvolvimento.

### Pré-requisitos (O que instalar primeiro)

1.  **Node.js:** Essencial para rodar o ambiente JavaScript. Baixe a versão LTS em [nodejs.org](https://nodejs.org/en/). A instalação já inclui o `npm`.
2.  **Git:** Necessário para clonar o repositório. Baixe em [git-scm.com](https://git-scm.com/).
3.  **MariaDB Server:** O nosso banco de dados. Baixe em [mariadb.org/download/](https://mariadb.org/download/). Durante a instalação, defina uma senha para o usuário `root` e guarde-a.
4.  **VS Code (Recomendado):** Um editor de código com excelente suporte para TypeScript. Baixe em [code.visualstudio.com](https://code.visualstudio.com/).
5.  **HeidiSQL ou DBeaver (Recomendado):** Uma ferramenta com interface gráfica para gerenciar o banco de dados.

### Parte 1: Configuração do Banco de Dados

1.  Abra seu gerenciador de banco de dados (HeidiSQL ou DBeaver).
2.  Conecte-se ao seu servidor MariaDB local (usuário `root` e a senha que você definiu).
3.  Execute os scripts SQL da seção "Configuração do Banco de Dados" abaixo para criar o banco de dados e todas as tabelas necessárias.

### Parte 2: Configuração do Back-end

1.  Abra um terminal e clone o repositório para uma pasta de sua escolha:
    ```bash
    git clone https://github.com/GabrielAlex01/Controle-de-Despesas
    ```
2.  Navegue até a pasta do back-end:
    ```bash
    cd nome-da-pasta/controle-despesas-backend
    ```
3.  Instale todas as dependências do projeto:
    ```bash
    npm install
    ```
4.  Crie um arquivo chamado `.env` na raiz desta pasta.

5.  Copie e cole o conteúdo abaixo no arquivo `.env`, substituindo pelos seus dados:
    ```env
    DB_PASSWORD="a_senha_que_voce_criou_para_o_mariadb"
    JWT_SECRET="crie_uma_chave_longa_e_aleatoria_aqui"
    EMAIL_USER="seu_email_de_envio@gmail.com"
    EMAIL_PASS="sua_senha_de_app_de_16_letras_do_gmail"
    ```
6.  Inicie o servidor em modo de desenvolvimento. Ele irá reiniciar automaticamente a cada alteração no código.
    ```bash
    npm run dev
    ```
    * Se tudo estiver correto, você verá a mensagem "Servidor back-end rodando na porta http://localhost:3000".

### Parte 3: Configuração do Front-end

1.  Abra uma **nova janela do terminal**.
2.  Navegue até a pasta do front-end:
    ```bash
    cd nome-da-pasta/controle-despesas # (ou o nome da sua pasta front-end)
    ```
3.  Se você fizer alterações no arquivo `app.ts`, precisará compilá-lo. Você pode deixar um terminal rodando este comando para compilar automaticamente a cada salvamento:
    ```bash
    tsc -w
    ```
4.  Para visualizar a aplicação, abra o arquivo `index.html` no seu navegador. A forma mais fácil é usando a extensão **Live Server** no VS Code (clique com o botão direito no `index.html` e selecione "Open with Live Server").

Agora a aplicação completa está rodando! Você pode acessar a interface do front-end, que se comunicará com o back-end que está rodando no outro terminal.


## 🗄️ Configuração do Banco de Dados

Execute os seguintes comandos SQL no seu MariaDB para criar a estrutura necessária.

```sql
-- Crie o banco de dados primeiro (se não existir)
CREATE DATABASE controle_despesas;
USE controle_despesas;

-- Criação da Tabela de Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel ENUM('mestre', 'editor', 'visualizador') NOT NULL DEFAULT 'visualizador',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criação da Tabela de Despesas
CREATE TABLE despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fornecedor VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    vencimento DATE NOT NULL,
    categoria ENUM('comercial', 'servicos', 'despesas-extras') NOT NULL,
    periodicidade ENUM('Unica', 'Mensal', 'Anual', 'Parcelada') NOT NULL,
    notaFiscal VARCHAR(255),
    situacaoFinanceiro ENUM('Pendente', 'Entregue') NOT NULL DEFAULT 'Pendente',
    situacaoFiscal ENUM('Pendente', 'Entregue') NOT NULL DEFAULT 'Pendente',
    status ENUM('Pendente', 'Pago') NOT NULL DEFAULT 'Pendente',
    total_parcelas INT NULL DEFAULT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criação da Tabela de Logs
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    despesa_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (despesa_id) REFERENCES despesas(id) ON DELETE SET NULL
);



-- Crie o primeiro usuário Mestre manualmente para iniciar o sistema
-- Lembre-se de usar uma senha forte e gerar o hash dela para inserir aqui.
-- INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES ('Admin', 'admin@empresa.com', 'seu_hash_bcrypt_aqui', 'mestre');
```

Com a configuração acima, o ambiente estará pronto para rodar a aplicação. Este projeto foi desenvolvido como uma solução prática para um desafio real do dia a dia, buscando aplicar conceitos modernos de desenvolvimento web, segurança e automação. Sinta-se à vontade para explorar, utilizar e contribuir com o projeto.
