const { criarServidor } = require('./app');

const porta = Number(process.env.PORT) || 3000;

criarServidor().listen(porta, () => {
  console.log(`API ouvindo na porta ${porta}`);
});