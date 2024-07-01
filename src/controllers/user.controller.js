import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/Cloudinary_services.js"
import { Apiresponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessandRefreshTokens = async(userId)=>{
    //user ke through user_id we can fetch
    try {
        const user = await User.findOne(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //access token toh we give to user but refreshtoken is kept in db so that won't need to ask password to user frequently
        user.refreshToken= refreshToken
       await user.save({validatebeforeSave:false}) //mongodb se save method
        // save is a method typically provided by an ORM (Object-Relational Mapping) library, such as Mongoose in the context of MongoDB, to persist changes to the database.
// The object { validateBeforeSave: false } is an options object passed to the save method.

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }

}


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
    //basically we extracted all data points/fields from req.body
     const {fullname, email, username, password} = req.body
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
    // if(!email.includes('@')) throw new ApiError(400,"@ is required char for a valid email");

    //checking if user already exists , for this we need to import all Users from model/User.model.js
    //User will only call mongodb on our behalf desired number of times ,
    //findOne function helps us find whether we have any existing field already
    //we need to check either username or email(we are doing this using $or which takes an array of objects as i/p for which they check duplicity)

    //since we say that db is in another continent so whenever we communicate with db use await
   const existedUser= await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")//check for parameters in apiError
    }

    //Now handling files(images,avatar)
    //since we injected a middleware in routes/UserRoutes  toh middleware just adds more fields in request
    const avatarLocalPath=req.files?.avatar[0]?.path;
    //avatar k first property(? indicates 'if exists') ,if exists then send me the path of file (which is uploaded by multer in public/temp and we are given originalname of file)
        // const coverImageLocalPath= req.files?.coverImage[0]?.path;

        //Classic way to check if we have coverImage or not ,isArray checks whether the value passed in it is an array or not
        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage)
        && req.files.coverImage.length >0){
            coverImageLocalPath= req.files.coverImage[0].path
        }


        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar file is required")
        }

       // console.log(req.files);

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
        username: username?.toLowerCase()
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

//creating access jwt and refresh jwt , one is short lived(Access) and other is long-lived
//read in backend notes about access and refresh token
const loginUser=asyncHandler(async(req,res)=>{
    /*
   req body ->data
   username or email
   find the user
   password check
   access and refresh token generate    
   send token in form of cookies

 1.validation of input fields
2. check if users credentials is present in db
3. compare passwords
4. generate access and refresh token
5. return response of access and refresh token in cookies

*/

const {email,username,password} = req.body

if(!username && !email){ //can modify as per our need , if we only require email to log in then change the conditions based on our requirement
    throw new ApiError(400,"Username or email is required")
}
//alternative of above condition if(!(username || email))

//now we need to check in our db if a user is registered then he/she can login else redirect him/her to register page
//In MongoDB, the findOne method is used to retrieve a single document from a collection that matches the given query. If multiple documents match the query, it returns the first document it encounters.
//that field using which we want to retrieve registered user can be either email or username or both or either one of then only , we can take it in account using $or
 const user = await User.findOne({
    $or: [{username},{email}] //ab ye operator find krega user ko ya toh username ke basis pr mil jaaye ya email ke basis pr mil jaaye
})

if(!user){
    throw new ApiError(404,"User doesn't exist")
}

//if we find that user is registered then check for his'her credentials
const isPasswordValid = await user.isPasswordCorrect(password)

if(!isPasswordValid){
    throw new ApiError(404,"Invalid user credentials")
}

//access and refresh token generate karo
//since it is going to be used multiple times therefore generate a method for them for their reusability
//await kr do since this method may take time, destructure krke access token and refresh token lelo
 const {accessToken , refreshToken} = await generateAccessandRefreshTokens(user._id) //mongodb assign krta h _id 

 //optional step: user(variable) ke through saari field ki info h apne paas, user ko ky info send krni h ,  password ni bhejna aur refresh token ni bhejna that can be managed using select
 const loggedInUser = await User.findById(user._id).
 select("-password -refreshToken")

 //cookies to be sent
 const options ={
    httpOnly: true,
    secure: true
    //after truthyifying httpOnly and secue , cookies can only be modified by server not by all(which is usually common)
 }

 //returning response after logging In
 return res.status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
    new Apiresponse(
        200,
        {
            user:loggedInUser,accessToken,
            refreshToken
        },
        "User logged in successfully"
    )
 )
 

})


//logout handle karo
const logOutUser= asyncHandler(async(req,res)=>{
    //we need to perform two major tasks:
    //1) remove refreshToken 
    // 2)cookies remove
    //while logging in we had user access through email , password and all fields but while logging out we can't ask for someone's email so that they may logout 
    //here comes the concept of middleware , we can design our own custom middleware

    //after auth.middleware for verifying token we added an object user to req so as we were using req.body we can use req.user
    //route mei function kr rha h verifyJwt(as middleware)
     await User.findByIdAndUpdate(
        req.user._id,//agar req.user ha then usme se ._id we can find
        {
            $set:{//mongodb method whicxsh asks for fields to be updated
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options ={
        httpOnly: true,
        secure: true
    }
    return res.
    status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    //hese lines clear the cookies named accessToken and refreshToken. The options parameter can include cookie options such as path, domain, and other attributes that were used when the cookie was set.
    .json(new Apiresponse(200,{},"User logged Out successfully"))

})

//refreshaccesstoken ka endpoint banate ha , ye routes mei bnega
//sbse pahle controller hi banana padega
const refreshaccesstoken= asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken 
   //maybe cookies ke through refreshtoken na aaya ho body ke through aaye

   if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
   }
   //token ko verify krna hoga (incoming wale ko)
   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )//after verifying we get decoded token
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){//agar user ni h then invalid refresh token
     throw new ApiError(401,"Invalid refresh token ")
    }
 
    //since humne encoded refreshToken save kr liya th in db so match karana hoga
    if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"RefreshToken is expired or used")
    }
    //generate new tokens since refreshToken expired as well
    const options={
     httpOnly:true,
     secure:true
    }
    const {accessToken , newRefreshToken}= await generateAccessandRefreshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    //Sets a cookie named "accessToken" on the response object with the value provided by the accessToken variable. The options parameter likely contains additional configurations for the cookie, such as expiration settings, secure flags, etc.
    .cookie("refreshToken",newRefreshToken,options)
    .json(
     new Apiresponse(
        200,
         {accessToken,refreshToken:newRefreshToken},
         "Access Token refreshed "
     )
    )
 }
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    
   }
})


export {registerUser,
    loginUser,
    logOutUser,
    refreshaccesstoken
}