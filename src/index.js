//require('dotenv).config({path:'./env})
import dotenv from 'dotenv'
import connectDB from './db/index.js';

dotenv.config({
    path:'./env'
})



connectDB()//basically async await returns us a promise therefore we can apply .then ,.catch
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port:$
        {process.env.PORT}`);
    }) //agar port ni mil rha then 8000 pr run kr lo
})
.catch((err)=>{
    console.log("MONGO db connection failed!!!",err);
})



//Two important points about database connectivity: 

// 1. When connecting to databases, handling potential data-not-found scenarios is essential. Employ try/catch blocks or promises to manage errors or we can also use promises.

// key to remember : ( wrap in try-catch )

// 2. Database operations involve latency, and traditional synchronous code can lead to blocking, where the program waits for the database query to complete before moving on. So, we should async/await which allows for non-blocking execution, enabling the program to continue with other tasks while waiting for the database response. 

// key to remember :  ( always remember the database is in another continent, so use async await)



// -r dotenv/config: This part of the script uses the -r (or --require) flag to require the dotenv/config module before running your application. The dotenv package is commonly used to load environment variables from a .env file, and dotenv/config loads these variables into process.env. By requiring dotenv/config in this way, it ensures that the environment variables are loaded before your application starts, making them available in your application code.

// --experimental-json-modules: This part enables support for ECMAScript (ES) Modules in your Node.js application, particularly support for .mjs files. ECMAScript Modules are a standard for organizing and importing JavaScript code, similar to CommonJS modules (.js files). This flag is used to enable support for using ES Modules in your Node.js project, as they are not enabled by default in all Node.js versions.



















/*
import express from 'express'
const app=express()

(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/
        {DB_NAME}`)
        app.on("error",(error)=>{
            console.log("ERROR:",error);
            throw error
        })//db is connected but maybe express's app can't communicate

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    }catch(error){
        console.error("Error:",error)
        throw error
    }
})()//function executed immediately

Basically this is an approach ,now we are going to discuss another approach
*/