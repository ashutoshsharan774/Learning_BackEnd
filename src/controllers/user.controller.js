import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/Cloudinary_services.js"
import { Apiresponse } from "../utils/apiResponse.js";

//this method just registers user
//asyncHandler is a higher order function that passes a function
const registerUser= asyncHandler(async(req,res)=>{
    //get user details from frontend
    //Validation (to check whether email , username is satisfying required conditions and are in correct format)
    //check if user already exists:check through email or username
    //check for images , check for avatar
    //upload images and avatar to cloudinary,check for avatar once more(mandate)
    //create user Object(Since mongodb mei data bhej rhe which is nosql database therefore object banana imp h)- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //if created return response else throw err

    //if data is coming from form or json then body se mil jyega user details
     const {fullname,email,username,password}=req.body
    //  console.log("email:",email); postman mei jakr raw mei jakr json form mei email and password i/p krke we can check whether we r grtting response from req.body
    // if(fullname ===""){
    //     throw new apiError(400,"Fullname is required")
    // } we can check for validation for all fields one at atime using many if else blocks 
    //but we can handle them all at once
    /*
    The some method in JavaScript is used to test whether at least one element in an array passes the test implemented by the provided function. It returns a Boolean value: true if the callback function returns a truthy value for at least one element in the array; otherwise, it returns false. */
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim()==="") //cb mei field agar h then trim it if after trimming also its empty h then true return hoga agar ek bhi field empty then true return hoga
    ){
        throw new ApiError(400,"All fields are required");
    }
    //check if email contains @ or not
    if(!email.includes('@')) throw new ApiError(400,"@ is required char for a valid email");

    //checking if user already exists , for this we need to import all Users from model/User.model.js
    //User will only call mongodb on our behalf desired number of times ,
    //findOne function helps us find whether we have any existing field already
    //we need to check either username or email(we are doing this using $or which takes an array of objects as i/p for which they check duplicity)
   const existedUser= User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")//check for parameters in apiError
    }

    //Now handling files(images,avatar)
    //since we injected a middleware in routes/UserRoutes  toh middleware just adds more fields in request
    const avatarLocalPath=req.files?.avatar[0]?.path;
    //avatar k first property(? indicates 'if exists') ,if exists then send me the path of file (which is uploaded by multer in public/temp and we are given originalname of file)
        const coverImageLocalPath= req.files?.coverImage[0]?.path;

        if(avatarLocalPath){
            throw new ApiError(400,"Avatar file is required")
        }

        //upload them to cloudinary(import cloudinary_Services)
        //upload takes time therefore use  await
      const avatar= await  uploadOnCloudinary(avatarLocalPath)
      const coverImage= await uploadOnCloudinary(coverImageLocalPath)

      //check avatar once again(nahi hoga then db phatega)
      if(!avatar){
        throw new ApiError(400,"Avatar file is required")
      }

      //object banao and db mei entry kr do
      //db se User communicate k rha 
    const user=  await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "", //corner case : since we didn't check for coverImage as we checked for avatar so check and then .url or else empty
        email,
        password,
        username:username.toLowerCase()
      })
      //remove refreshToken and password
     const createdUser=await User.findById(user._id).select(
        "-password -refreshToken" //string k anda space deke likho 1st field, 2nd field and so on
     )//mongodb khud _id assign krta h 
     //using select method wo field pass lr skte ho that we need to check

     if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
     }

     //send/return response
     return res.status(201).json( //api response class ka new object bana
        new Apiresponse(200, createdUser, "User registerd Successfully")
     )


         
})


export {registerUser}