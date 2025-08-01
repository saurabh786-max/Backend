
import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
  
dotenv.config({
    path:'./.env'
}) 
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at the port :${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MONGOBD CONNECTION ERROR !!",error)
})








/*
import express from "express"
const app = express()
(async()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error" , (error)=>{
        console.log("ERROR:", error);
        throw error
       })

       app.listen(process.env.PORT, ()=>{
        console.log(`APP IS LISTINGING ON PORT ${process.env.PORT}`)
       })
    }catch(err){
        console.error("ERROR:", err)
        throw err
    }
})()

*/