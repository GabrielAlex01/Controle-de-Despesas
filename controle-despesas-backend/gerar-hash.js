// arquivo: gerar-hash.js (versão segura com input)

const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Digite a senha que você deseja usar: ', (senha) => {
  if (!senha) {
    console.error("\nA senha não pode ser vazia. Tente novamente.");
    rl.close();
    return;
  }
  
  const saltRounds = 10;
  
  // Gera o hash a partir da senha digitada
  bcrypt.hash(senha, saltRounds, (err, hash) => {
    if (err) {
      console.error("Erro ao gerar hash:", err);
    } else {
      console.log("\n=============================================================");
      console.log("HASH GERADO COM SUCESSO!");
      console.log("Copie a linha abaixo para usar no seu comando INSERT:");
      console.log(hash);
      console.log("=============================================================");
    }
    // Fecha a interface do terminal para encerrar o script
    rl.close();
  });
});