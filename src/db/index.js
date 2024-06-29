import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//we are using async fn because db is in other continent
const connectDB = async () => {
    try{
       const connectionInstance= await mongoose.connect
       (`${process.env.MONGODB_URI}/${DB_NAME}`)
       console.log(`\n MongoDB connected !! DB HOST: $
       {connectionInstance.connection.host}`);

    }catch(error){
        console.log("MONGODB connection FAILED",error);
        process.exit(1)
    }
}

export default connectDB;