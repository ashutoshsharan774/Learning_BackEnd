//This middleware will verify ki user hai ya ni hai

import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/User.model.js";



export const verifyJwt = asyncHandler(async(req,_,next)=>{//res k use ni h toh '_' likh skte ho
    //token ka access lenege, since req ke paas cookie ka access h that we gave in app.js 'app.use(cookieParser())'
    //agar accessToken ni ha(ho skta h cookies se accessToken na mile user ek custom header bhej raha ho for token as in case of mobile app)
    //verifying token to ensure that we have true login then we can add new obj to req i.e req.user
    try {
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer","") //since we don't want whole Bearer Token using js replace it with empty space , so we'll get just token
         /*
        Whenever the user wants to access a protected route or resource, the user agent should send the JWT, 
        typically in the Authorization header using the Bearer schema. The content of the header should look like the following:
                    Authorization: Bearer <token>
    
        */
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        //agar token h then we need to use jwt and check if token is correct or not and token ke inside ke info ko decode krna hoga
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET) //verify takes two input: token , secretorpublicKey(needed to decode info in token)
    
        const user=await User.findById(decodedToken?._id). //while making userschemamodel we used _id to store id in generating jwt accessToken
        select("-password -refreshToken")
    
        if(!user){
          
            throw new ApiError(404,"Invalid Access Token")
        }
    
        //agar user ha then what to do
        req.user=user;//req ke andar ek naya object add kr dete ha
        next()//this indicates ki verifyJWT ka work done in userRoutes file and now logOutUser function needs to be run
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
        
    }

   
})