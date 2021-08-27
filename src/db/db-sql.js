
if(!(global.dbUser && global.dbPassword)) {
    global.dbUser = process.argv[2]
    global.dbPassword = process.argv[3]
}

async function connect() {
    if(global.connection && global.connection.state !== 'disconnected')
        return global.connection

    const mysql = require('mysql2/promise')
    const urlDB = `mysql://${dbUser}:${dbPassword}@localhost:3306/test_crawler`
    'mysql://root:12345@localhost:3306/test_crawler'
    const connection = await mysql.createConnection(urlDB)

    global.connection = connection

    return connection
}

async function selectAllRequires() {
    try {
        const conn = await connect()
    
        const sql = 'SELECT * FROM requires;'
        const [rows] = await conn.query(sql)

        if(rows.length > 0)
            return rows

        return false
    }
    catch(error){
        console.log('> MYSQL ERROR selectAllRequires: \n', error)
        return false
    }
}

async function selectOneRequire(id) {
    try {
        const conn = await connect()

        const sql = `SELECT * FROM requires WHERE id = ?;`
        const [row] = await conn.query(sql, [id])
        
        if(row.length > 0)
            return row[0]
    
        return false
    }
    catch(error) {
        console.log('> MYSQL ERROR selectOneRequire: \n', error)
        return false
    }   
}

async function insertRequire(search) {
    try{
        const conn = await connect()
    
        const sqlInsert = 'INSERT INTO requires(search, idCrawler, status) VALUES (?, "", "pendente");'
        await conn.query(sqlInsert,[search])
        
        const sqlLastInsert = 'SELECT id FROM requires ORDER BY id DESC LIMIT 1;'
        const [lastInsert] = await conn.query(sqlLastInsert)
        
        if(lastInsert.length > 0)
            return lastInsert[0]

        return false
    }
    catch(error) {
        status = 'erro'
        console.log('> MYSQL ERROR insertRequire: \n',error)
        return false
    }   
}

async function updateRequire(idSearch, idCrawler, status) {
    try {
        const conn = await connect()
        const sqlInsert = 'UPDATE requires SET idCrawler = ?, status = ? WHERE id = ?;'

        const result = await conn.query(sqlInsert, [idCrawler, status, idSearch])

        if(result[0].changedRows == 1) 
            return true
        
        return false
    }
    catch(error) {
        status = 'erro'
        console.log('> MYSQL ERROR updateRequire: \n', error)
        return false
    }
}

module.exports = {selectAllRequires, selectOneRequire, insertRequire, updateRequire}
