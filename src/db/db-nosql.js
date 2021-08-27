const { MongoClient, ObjectId } = require('mongodb')

if(process.argv[4] == '' || process.argv[4] == undefined) 
    global.uri = 'mongodb://localhost:27017'
else 
    global.uri = `mongodb://${process.argv[4]}:${process.argv[5]}@localhost:27017`
    
const conn = new MongoClient(uri)

async function insertDoc(doc) {
    try {
        await conn.connect()
        const database = conn.db('crawlers')  
        const crawlers = database.collection('docsJson')

        const result = await crawlers.insertOne(doc)

        return `${result.insertedId}`
    }
    catch(error) {
        status = 'erro'
        console.log('> MONGO ERROR insertDoc: \n', error)
        return false
    }
    finally {
        await conn.close()
    }
}

async function findById(id) {
    try {
        await conn.connect()
        const database = conn.db('crawlers')
        const crawlers = database.collection('docsJson')

        return await crawlers.findOne({_id: ObjectId(id)})
    }
    catch(error) {
        console.log('> MONGO ERROR findById: \n', error)
        return false
    }
    finally {
        await conn.close()
    }
}

module.exports = {insertDoc, findById}
