const mongoose = require("mongoose")
const mongo_url = process.env.mongo_url || "mongodb://127.0.0.1:27017/ecommerce1"

const connectDB = async(options = {}) => {
    try {
        await mongoose.connect(mongo_url, options)
        console.log("db is connected.")
        mongoose.connection.on('error', (error) => {
            console.log(`db can not connect for ${error}`)
        })
    } catch (error) {
        console.log(`db can not connect for ${error.message}`)
    }
}

module.exports = connectDB;