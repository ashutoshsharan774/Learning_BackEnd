import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

//CORS is a mechanism that allows servers to specify who can access their resources and how those resources can be accessed.
// CORS works by adding HTTP headers to the server's responses. These headers indicate whether the requesting origin is permitted to access the resource.


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))//// Use CORS middleware with default settings

//limit banayenge ki limited json hi accept kare
app.use(express.json({limit:"16kb"}))

//url se agar data aaye toh express ko batana pdta h ki waha se bhi data aayega (uska apna encoder hota ha )
app.use(express.urlencoded({extended: true,limit:
    "16kb"})) //extended mtlb object ke andar bhi object de skte ho

app.use(express.static("public"))//jaise kayi baar pdf aayi ya images aayi toh apne hi server p store krna chahte h toh ek public folder bana diya
//All these are express configurations

// Cookies are small pieces of data stored on the user's computer by the web browser while browsing a website. They are used to remember information about the user between sessions or across different pages of the same site. Cookies are widely used for various purposes, including session management, personalization, and tracking.
app.use(cookieParser())



//routes import
//import statement mei we can give name that we want only if we have export default
import userRouter from './routes/userRoutes.js'

//routes declaration (pahle we used to write app.get as routes same file mei declared the but ab routes dusre file mei h
// therfore we need to bring middlewares in function so use app.use
// )
app.use("/api/v1/users",userRouter) //instead of just '/users' std. practice is to use api then its version then users
//aise hi url banta h , ab isko as it is rhne dena h aur agr login krna h then userRoutes mei jakr login ke liye url bana dena(as we made for register)
//basically control is now given to userRouter and then userRoutes mei jakr register pr ja

//ye kuch aisa url dikhega : http://localhost:8000/api/v1/users/register

export { app }
