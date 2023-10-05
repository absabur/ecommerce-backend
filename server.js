const app = require("./app");
require("dotenv").config();
const cloudinary = require("cloudinary");
// const connectDB = require("./config/database.js");
// const hostname = '0.0.0.0'
const mongoose = require("mongoose")
require("dotenv").config();
const mongo_url = process.env.mongo_url || "mongodb://127.0.0.1:27017/ecommerce2"

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Uncaught Exception`);
  process.exit(1);
});

app.listen(process.env.PORT, async () => {
  console.log(`server is running at http://localhost:${process.env.PORT}`);
  try {
    const options = { 
      useNewUrlParser: true, 
      useUnifiedTopology: true, 
    }
    await mongoose.connect(mongo_url, options)
    console.log("db is connected.")
    mongoose.connection.on('error', (error) => {
        console.log(`db can not connect for ${error}`)
    })
} catch (error) {
    console.log(`db can not connect for ${error.message}`)
}
  await cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SERVER,
  });
  console.log(`cloudinary is connected`);
});

// Unhandled Promise Rejection
// process.on("unhandledRejection", (err) => {
//     console.log(`Error: ${err.message}`);
//     console.log(`Shutting down the server due to Unhandled Promise Rejection`);

//     server.close(() => {
//       process.exit(1);
//     });
//   });
