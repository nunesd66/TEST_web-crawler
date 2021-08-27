const express = require('express')
const dbSql = require('./db/db-sql')
const dbNoSql = require('./db/db-nosql')
const crawler = require('./service/crawler')

const routes = express.Router()

async function findAll(req, res) {
    try {
        const result = await dbSql.selectAllRequires()

        const noResult = !result
        if(noResult) {
            const msg = 'Você ainda não fez nenhuma busca'
            return res.status(200).send({message: msg})
        }

        return res.status(200).send(result)
    }
    catch(error) {
        console.log('ROUTES ERRO findAll: \n' + error)
        return res.status(500).send({
            status: 'Error',
            message: error.message
        })
    }
}

async function findById(req, res) {
    try {
        const { id } = req.params
        const searchCrawler = await dbSql.selectOneRequire(id)

        const noResult = !searchCrawler
        if(noResult) {
            const msg = `Id ${id} não encontrado`
            return res.status(404).send({message: msg})
        }
           
        if(searchCrawler.idCrawler == '') {
            return res.status(200).send(searchCrawler)
        }

        return res.status(200).send(await dbNoSql.findById(searchCrawler.idCrawler))
    }
    catch(error) {
        console.log('ROUTES ERRO findById: \n' + error)
        return res.status(502).send({
            status: 'Error',
            message: error.message
        })
    }
}

async function insertData(req, res) {
    let searchCrawler
    try {
        const { search } = req.body

        if(search == undefined) {
            const msg = 'Esperado a chave search'
            return res.status(400).json({error: msg})
        }

        (async() => {
            global.status
            const resultSet = await crawler.runCrawler(search)
            
            const emptyResultSet = !resultSet
            if(emptyResultSet) {
                status = 'erro'
                await dbSql.updateRequire(searchCrawler.id, '', status)
            }
            else {
                const idCrawler = await dbNoSql.insertDoc(resultSet)
                status = 'sucesso'

                const {message} = await dbNoSql.findById(idCrawler)
                if(message) 
                    status = 'atenção'

                await dbSql.updateRequire(searchCrawler.id, idCrawler, status)
            }
        })()

        searchCrawler = await dbSql.insertRequire(search)
        return res.status(201).json(searchCrawler)
    }
    catch(error) {
        console.log('ROUTES ERRO insertData: \n' + error)
        if(searchCrawler.id != null)
            status = 'erro'
            await dbSql.updateRequire(searchCrawler.id, '', status)

        return res.status(500).send({
            status: 'Error',
            message: error.message
        })
    }
}

routes.get('/', findAll)
routes.get('/:id', findById)
routes.post('/', insertData)

module.exports = routes
