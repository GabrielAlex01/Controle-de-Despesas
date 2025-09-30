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
* **Recuperação de Senha Segura:** Fluxo completo de "esqueci a senha" com tokens de uso único e tempo de expiração enviados por e-mail.
* **Relatórios Individuais de Despesas:** Análise de tendência histórica para cada despesa, com gráfico de evolução de valores pagos ao longo do tempo.
* **Auditoria e Logs:** Registro detalhado de todas as ações importantes (criação, alteração, exclusão) com informação de qual usuário realizou a ação, quando, e o que foi alterado.
* **Notificações por E-mail:** 
    * Serviço automatizado que verifica diariamente as contas a vencer e envia e-mails de alerta para os usuários responsáveis.
    * Notificações instantâneas para administradores sobre alterações em despesas de valor fixo.

## 🛡️ Foco em Cibersegurança

A segurança foi um pilar central no desenvolvimento da aplicação. As seguintes camadas e medidas foram implementadas para garantir a proteção dos dados e a integridade do sistema:

* **Gerenciamento de Segredos com Variáveis de Ambiente (`.env`):** Credenciais críticas (senha do banco, segredo JWT, credenciais de e-mail) são mantidas fora do código-fonte, em um arquivo `.env` local. Este arquivo é excluído do controle de versão (`.gitignore`), garantindo que segredos nunca sejam expostos em repositórios de código.
* **Criptografia de Senhas com `bcrypt`:** As senhas dos usuários nunca são armazenadas em texto puro. Utilizamos o algoritmo `bcrypt`, o padrão da indústria, para gerar um *hash* seguro e com "sal" de cada senha, que é o que fica armazenado no banco de dados. A verificação no login é feita comparando o hash da senha fornecida com o hash armazenado, sem nunca expor a senha original.
* Tokens Seguros para Redefinição de Senha: O sistema de "esqueci a senha" utiliza tokens criptograficamente seguros (crypto), de uso único e com tempo de expiração, para validar a identidade do usuário antes de permitir a alteração da senha.
* **Autenticação via Token JWT (JSON Web Token):** Após o login, o usuário recebe um token JWT assinado digitalmente com o segredo do servidor. Para cada requisição a endpoints protegidos, este token deve ser enviado, provando a identidade do usuário.
* **Middlewares de Segurança em Camadas:** O acesso aos endpoints da API é controlado por uma cadeia de middlewares que funcionam como "porteiros" sequenciais:
    1.  **`verificarToken` (Autenticação):** O primeiro porteiro verifica se um token JWT válido foi enviado no cabeçalho da requisição. Se o token não existir, for inválido ou tiver expirado, o acesso é imediatamente bloqueado.
    2.  **`verificarPapel` (Autorização):** Uma vez que a identidade do usuário é confirmada, o segundo porteiro verifica seu "cargo" (`papel`: mestre, editor, etc.). Cada endpoint crítico possui uma lista de papéis autorizados, e se o usuário não tiver o cargo necessário, seu acesso é bloqueado com uma mensagem de "permissão negada".
* **Prevenção de SQL Injection:** Todas as interações com o banco de dados MariaDB são realizadas através de **consultas parametrizadas**. Isso impede que dados maliciosos inseridos por um usuário sejam executados como comandos SQL, neutralizando um dos vetores de ataque mais comuns e perigosos.
* **Regras de Negócio Seguras:** Foram implementadas lógicas no back-end para prevenir ações que poderiam comprometer o sistema, como impedir que um usuário `mestre` possa excluir ou rebaixar a si mesmo, garantindo a continuidade da administração da ferramenta.
* **Prevenção de Ataques de Força Bruta e DDoS com Rate Limiting:** Utilizando a biblioteca express-rate-limit, a API implementa um controle de taxa de requisições. Há um limite geral para todas as rotas, mitigando ataques de negação de serviço. Além disso, um limite muito mais estrito é aplicado aos endpoints de autenticação (login, recuperação de senha, etc.), tornando ataques de força bruta para adivinhar senhas praticamente inviáveis.

## 🛠️ Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3, TypeScript
* **Back-end:** Node.js, Express.js, TypeScript
* **Banco de Dados:** MariaDB
* **Segurança:** JSON Web Token (JWT), bcrypt, crypto, express-rate-limit e Middlewares de autorização
* **Automação de E-mails:** Nodemailer, node-cron

## 🚀 Tutorial de Instalação e Execução Localmente no Windows

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
4.  Dê o comando a seguir e anote a chave Hash, você irá utiliza-la mais para frente.

    ```bash
    node gerar-hash.js
    ```

5.  Crie um arquivo chamado `.env` na raiz desta pasta.

6.  Copie e cole o conteúdo abaixo no arquivo `.env`, substituindo pelos seus dados:
    ```env
    DB_PASSWORD="a_senha_que_voce_criou_para_o_mariadb"
    JWT_SECRET="crie_uma_chave_longa_e_aleatoria_aqui"
    EMAIL_USER="seu_email_de_envio@gmail.com"
    EMAIL_PASS="sua_senha_de_app_de_16_letras_do_gmail"
    ```
7.  Inicie o servidor em modo de desenvolvimento. Ele irá reiniciar automaticamente a cada alteração no código.
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
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `papel` enum('mestre','editor','visualizador') DEFAULT 'visualizador',
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Criação da Tabela de Despesas
CREATE TABLE `despesas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fornecedor` varchar(255) DEFAULT NULL,
  `valor` decimal(10,2) DEFAULT NULL,
  `vencimento` date DEFAULT NULL,
  `categoria` enum('comercial','servicos','despesas-extras') DEFAULT NULL,
  `periodicidade` enum('Unica','Mensal','Anual','Parcelada') DEFAULT NULL,
  `notaFiscal` varchar(255) DEFAULT NULL,
  `situacaoFinanceiro` enum('Pendente','Entregue') DEFAULT 'Pendente',
  `situacaoFiscal` enum('Pendente','Entregue') DEFAULT 'Pendente',
  `status` enum('Pendente','Pago') DEFAULT 'Pendente',
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `total_parcelas` int(11) DEFAULT NULL,
  `tem_valor_fixo` tinyint(1) DEFAULT 0,
  `valor_fixo` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Criação da Tabela de Logs
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` text DEFAULT NULL,
  `data_hora` timestamp NULL DEFAULT current_timestamp(),
  `usuario_id` int(11) DEFAULT NULL,
  `despesa_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_logs_usuario_id` (`usuario_id`),
  KEY `idx_logs_despesa_id` (`despesa_id`),
  CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

```

### Script para Configuração de Usuário (Passo Crítico)

*** Após criar as tabelas, execute este comando para garantir que o usuário root use um método de autenticação compatível com a aplicação. Substitua SUA_SENHA_AQUI pela senha que você definiu para o root do MariaDB. ***

```sql
GRANT USAGE ON *.* TO 'root'@'localhost' IDENTIFIED BY 'SUA_SENHA_AQUI';
FLUSH PRIVILEGES;
```
### Script para Criar o Primeiro Administrador

```sql
-- Lembre-se de usar uma senha forte e gerar o hash dela para inserir aqui.
INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES ('Admin', 'admin@empresa.com', 'seu_hash_bcrypt_aqui', 'mestre');
```

### 🐧 Tutorial de Instalação e Execução Localmente no Linux

### Passo 1: Instalação das Ferramentas Essenciais

Abra o terminal e execute os seguintes comandos:

1.  Atualize o Gerenciador de Pacotes:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
    
2. Instale o Git e o MariaDB Server:
   ```bash
    sudo apt install -y git mariadb-server curl
    ```
   
3. Instale o Node.js via NVM (Node Version Manager):
Este é o método recomendado para garantir a versão correta do Node.js.
      ```bash
      # Baixa e executa o script de instalação do NVM
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

      # Carrega o NVM no terminal (pode ser necessário fechar e reabrir o terminal após este passo)
      source ~/.bashrc

      # Instala a versão LTS (Long-Term Support) mais recente do Node.js
      nvm install --lts
    ```

### Passo 2: Configuração Inicial do Banco de Dados

1. Execute o Script de Segurança do MariaDB: Este é um passo crucial para definir sua senha `root` e proteger o banco.
    ```bash
       sudo mariadb_secure_installation
    ```
   * ** Siga as instruções na tela. Quando ele perguntar a senha atual do root, pressione Enter (geralmente não há uma).

   * ** Defina uma senha forte para o root quando solicitado e anote-a.

   * ** Responda "Y" (sim) para todas as outras perguntas (remover usuários anônimos, desabilitar login remoto do root, etc.).

2. Crie a Estrutura do Banco:
Acesse o MariaDB com o usuário `root` :
    ```bash
       sudo mariadb
    ```
Dentro do console do MariaDB, cole o bloco de código abaixo inteiro e pressione Enter. Ele criará o banco de dados e todas as tabelas.
```sql
      CREATE DATABASE IF NOT EXISTS controle_despesas;
      USE controle_despesas;

      CREATE TABLE `usuarios` (
        `id` int(11) NOT NULL AUTO_INCREMENT, `nome` varchar(255) NOT NULL, `email` varchar(255) NOT NULL,
        `senha_hash` varchar(255) NOT NULL, `papel` enum('mestre','editor','visualizador') DEFAULT 'visualizador',
        `criado_em` timestamp NULL DEFAULT current_timestamp(), `reset_token` varchar(255) DEFAULT NULL,
        `reset_token_expires` datetime DEFAULT NULL, PRIMARY KEY (`id`), UNIQUE KEY `email` (`email`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

      CREATE TABLE `despesas` (
        `id` int(11) NOT NULL AUTO_INCREMENT, `fornecedor` varchar(255) DEFAULT NULL, `valor` decimal(10,2) DEFAULT NULL,
        `vencimento` date DEFAULT NULL, `categoria` enum('comercial','servicos','despesas-extras') DEFAULT NULL,
        `periodicidade` enum('Unica','Mensal','Anual','Parcelada') DEFAULT NULL, `notaFiscal` varchar(255) DEFAULT NULL,
        `situacaoFinanceiro` enum('Pendente','Entregue') DEFAULT 'Pendente', `situacaoFiscal` enum('Pendente','Entregue') DEFAULT 'Pendente',
        `status` enum('Pendente','Pago') DEFAULT 'Pendente', `criado_em` timestamp NULL DEFAULT current_timestamp(),
        `atualizado_em` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(), `total_parcelas` int(11) DEFAULT NULL,
        `tem_valor_fixo` tinyint(1) DEFAULT 0, `valor_fixo` decimal(10,2) DEFAULT NULL, PRIMARY KEY (`id`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

      CREATE TABLE `logs` (
        `id` int(11) NOT NULL AUTO_INCREMENT, `descricao` text DEFAULT NULL, `data_hora` timestamp NULL DEFAULT current_timestamp(),
        `usuario_id` int(11) DEFAULT NULL, `despesa_id` int(11) DEFAULT NULL, PRIMARY KEY (`id`),
        KEY `idx_logs_usuario_id` (`usuario_id`), KEY `idx_logs_despesa_id` (`despesa_id`),
        CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

      EXIT;
```
    
### Passo 3: Clonar e Configurar a Aplicação

1.  Atualize o Gerenciador de Pacotes:
    ```bash
      git clone https://github.com/GabrielAlex01/Controle-de-Despesas.git
    ```
    
2.  Navegue até a pasta do back-end:
    ```bash
      cd Controle-de-Despesas/controle-despesas-backend
    ```
    
3. Instale as dependências:
    ```bash
      npm install
    ```
    
4. Crie e configure o arquivo `.env`:
    ```bash
      nano .env
    ```
    
Dentro do editor nano, cole o conteúdo abaixo e preencha com seus dados (a senha do root que você definiu, suas credenciais do Gmail, etc.).
    ```bash
      DB_PASSWORD="a_senha_do_root_que_voce_criou"
      JWT_SECRET="crie_uma_chave_longa_e_aleatoria_aqui"
      EMAIL_USER="seu_email_de_envio@gmail.com"
      EMAIL_PASS="sua_senha_de_app_de_16_letras_do_gmail"
    ```
Pressione Ctrl+X, depois Y e Enter para salvar e sair.

### Passo 4: Clonar e Configurar a Aplicação

1.  No terminal, ainda na pasta `controle-despesas-backend`, gere a senha segura para o seu primeiro usuário:
    ```bash
      node gerar-hash.js
    ```
    
2. Digite a senha que você quer usar para o admin e copie o hash que será gerado.

3. Acesse o MariaDB novamente (sudo mariadb) e execute o comando INSERT, colando o seu hash.
   ```bash
      INSERT INTO controle_despesas.usuarios (nome, email, senha_hash, papel) VALUES ('Admin', 'admin@empresa.com', 'COLE_O_SEU_HASH_GERADO_AQUI', 'mestre');
      EXIT;
    ```

### Passo 5: Clonar e Configurar a Aplicação

1. Back-end: Em um terminal, na pasta controle-despesas-backend, inicie o servidor:
   ```bash
      npm run dev
    ```
   O servidor começará a rodar em http://localhost:3000. Deixe este terminal aberto.

2. Front-end: Navegue até a pasta raiz do projeto `(Controle-de-Despesas)` no seu gerenciador de arquivos e dê um duplo clique no arquivo `index.html`.

Ele abrirá no seu navegador e a aplicação estará pronta para ser usada e testada no seu ambiente Linux, exatamente como você fazia no Windows.

Com a configuração acima, o ambiente estará pronto para rodar a aplicação. Este projeto foi desenvolvido como uma solução prática para um desafio real do dia a dia, buscando aplicar conceitos modernos de desenvolvimento web, segurança e automação. Sinta-se à vontade para explorar, utilizar e contribuir com o projeto.
