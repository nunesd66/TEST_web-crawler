if(process.argv.length < 6) {
    console.log('inicie com: "$ npm start usuario_sql senha_sql usuario_nosql senha_nosql"');
    return;
}

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit')

const routes = require('./routes');

const server = express();

const limit = rateLimit({
    max: 50,
    windowMs: 5 * 60 * 1000,
    message: {message: 'Aguarde 5 minutos para fazer novas requisições.'}
});

server.use(express.json());
server.use(helmet());
server.use('/', limit, routes);

server.listen(8000);
