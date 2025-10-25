require('dotenv').config()
const express=require('express');
const connectDB=require('./database/db')

const app=express();

//connect database
connectDB();


const PORT=process.env.PORT|| 5000
app.listen(PORT,()=>{
    console.log(`Server is running  on port ${PORT}`);
    
})