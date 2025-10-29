require('dotenv').config();
const mongoose = require("mongoose");

const connectToDatabase=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected Sucessfully!");
        
    } catch (error) {
        console.log("Database Connection failed: ",error);
        process.exit(1)
    }
}

module.exports=connectToDatabase;