import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/User.model.js"
import {uploadOnCloudinary} from "../utils/Cloudinary_services.js"
import { Apiresponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { application } from "express";

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

const changeCurrentUserPassword =asyncHandler(async(req,res)=>{
    const { oldPassword, newPassword } = req.body
    //step1:we require a user tabhi toh uske field mei jaakr password verify krwa paynege
    // ab user kaise le ,user password change kr pa raha mtlb wo logged in h
    //how to find if user is loggedin toh we made a middleware for that , req.user=user se userid le skte h(jwt verify krke hmne kara th)
   const user = await User.findById(req.user?._id)
   //isPasswordCorrect method wwas designed by us in User.model.js,since user model aaya h through "User" toh iske paas isPAsswordCorrect method hoga
   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)//since isPasswordCorrect is async method therfore we need to have await
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }

    //our old password is valid and now we wanna set new password
    user.password=newPassword
    await user.save({validatebeforeSave:false})
    //since user is made through User->came from User.model.js therefore it has password method
    //ab modify kr rhe password toh User.model.js mei jakr dekho ki bcrypt krkebhej rhe password
    //jab user save hoga then only save hone se pahle modifications(in password field) will be taken in account and will be encrypted before being saved
    return res
    .status(200)
    .json(new Apiresponse(200,{},"Password changed successfully"))

    //agar confirm password wala concept apply krna then jaha pr humne req.body se extract kiya h waha confPassword bana
    //if(!(confPassword===newPassword)){ throw new apiError("confPassword doesn't match")}

})

 //current get user since humne middleware banaya hi ha toh req mei user object add ho gya h 
 const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fetched successfully")
 })

 //We decide in backend about what changes(in user account) are to be allowed for users
 //agar any files are being updated like avatar,coverImage handle them in separate controller
 const updateAccountDetails =asyncHandler(async(req,res)=>{
    const {fullname, email} =req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
   const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            //mongodb operator:set
            $set:{
                fullname,
                email:email //both syntaxes are correct , fullname:fullname is same as fullname,
            }
        },
        {new:true} //update hone ke baad ki info return ho jaati h

        /*req.user?._id: This retrieves the _id of the user from the req object, using optional chaining (?.) to safely access the property even if req.user is undefined.
$set: This operator is used to set the value of specific fields in the document. In this case, it sets the fullname and email fields. Both fullname and email are assumed to be variables containing the new values.
{ new: true }: This option tells Mongoose to return the modified document rather than the original. */

    ).select("-password") //agar yaha aise ni krte then user._id krek ek aur backend query hit krte db ko ,findbyid krke user do and then select password krke hata dete 
    return res
    .status(200)
    .json(new Apiresponse(200,user,"Account details update successfully"))

 })

 //update files based data
 //multer middleware lagani hogi, so that we may be able to accept files
 //wahi log files accept kr paaye jo loggedIn ho
 //the above two things are middleware and will be taken care off in routes

 //controller for file updation
 const updateUserAvatar=asyncHandler(async(req,res)=>{
    //multer middleware ke through we got req.file ,here we are allowing updation of one avatar therefore just file not files
    const avatarLocalPath= req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    //upload this avatar on cloudinary
   const avatar= await uploadOnCloudinary(avatarLocalPath)
    //if we didn't recieve email after avatar is uploaded
   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }
   //TODO:delete old avatar
   //update
   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar:avatar.url //cloudinary ka pura object we recieved toh usme se sirf url update kro ,everything else will be taken care off kyuki we get a url by cloudinary (after we upload file on it)
        }
    },
    {
        new:true
    }
   ).select("-password")
   return res
   .status(200)
   .json(new Apiresponse(200,user,"avatar updated successfully"))
 })
 


 const updateUserCoverImage=asyncHandler(async(req,res)=>{
    //multer middleware ke through we got req.file ,here we are allowing updation of one avatar therefore just file not files
    const coverImageLocalPath= req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }

    //upload this avatar on cloudinary
   const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    //if we didn't recieve email after avatar is uploaded
   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on coverimage")
   }
   //update
   const user= await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage:coverImage.url //cloudinary ka pura object we recieved toh usme se sirf url update kro ,everything else will be taken care off kyuki we get a url by cloudinary (after we upload file on it)
        }
    },
    {
        new:true
    }
   ).select("-password")

   return res
   .status(200)
   .json(new Apiresponse(200,user,"coverImage updated successfully"))
 })

 const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username}= req.params //when we visit any channel we go to url ,we can fetch username from url using req.params, 
   //it may be possible that params is empty
   if(!username?.trim()){
    throw new ApiError(400,"username is missing")
   }
  // User.find({username})//where clause inside find, User mei se username field k need ni ha just directly
  //use aggregation wo field selection $match krlega
   const channel = await User.aggregate([
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
    //The $lookup aggregation stage in MongoDB performs a left outer join(a left-outer join returns all data from the left collection and any matching data from the right collection. If there is no matching data in the right collection, only data from the left collection is returned) 
    // to another collection in the same database to filter in documents from the “joined” collection for processing. 
    // This is useful when you want to combine data from multiple collections.
    {//this lookup finds how many subsciber a channel has
        $lookup:{
            from:"subscriptions", //db mei Subscription model lowercase mei and plural ho jyegi ,This is the name of the other collection(subscription is a collection) you want to join with.
            localField:"_id",//This is the field in the current collection's documents(_id field in current collection) that you will use to match with the other collection's documents.
            foreignField:"channel", //This is the field in the other collection's documents(here other collection is subscription) that you will use to match with the current collection's documents.
            as:"subscribers"
            //subscriptions ko milana chahte h _id(user) se using channel and call it as subscribers(field)  //basically user._Id us channel k subscribers hue 
        }

    },
    //another lookup to find how many of channels are subscribed by a channel
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }

    },
    //$addfields:The $addFields stage in MongoDB's aggregation framework is used to add new fields to documents. It can also be used to modify existing fields. The new fields can be calculated based on the existing fields in the documents.

    {
        $addFields:{
            subscribersCount:{
                $size:"$subscribers" //since subscriber is a fields use $sign
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            //to check if a user has subscribed or not
            isSubscribed:{
                $cond:{
                   if: {$in: [req.user?._id,"$subscribers.subscriber"]}, //subscriber field ke inside object hit oh ha ,toh uske nadar jaakr dekh lo user present hh ki ni ($in array and object dono ke andar jaakr dekh leta h)
                   then:true,
                   else:false
                }
            }
        }//The $addFields stage adds new fields to the documents.
// The $size operator is used to count the number of elements in the arrays.


    },
    //$project:saari cheezein ni deni h selected dena h 
    // The $project stage in MongoDB aggregation allows you to reshape documents by including, excluding, or adding new fields

    {
        $project:{
            fullname:1,//flag 1 ha fullnaem ka that means 'fullname' ko include krna h
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1,
            createdAt:1
        }


    }
   ]) //aggregate is method that takes array of objects (objects are pipelines)
   //db is in another continent


   //is channel ko ek baar log into console and observe
 //check if ki channel hi ni h
 if(!channel?.length){
    throw new ApiError(404,"channle doesn't exist")
    }
    return res
    .status(200)
    .json(new Apiresponse(200,channel[0],"User Channel fetched successfully"))


 })



 //How to get user watch hitory , have a look at model of backend,
//  we have to use pipeline($lookup) for getting details of documnets of video collection
//Now we use lookup pipeline for getting details of watchhistory form video collection, we will
//be able to fetch documents but there is an owner object in video collection which itself is an 
//user therefore we need to use nested lookup(wahi pr owner k details ke liye lookup lagana hoga
    //so that we can fetch details of owner from user collection, this way we'll get all documnets for watchHistory)

    const getWatchHistory=asyncHandler(async(req,res)=>{
       // req.user?._id //Interview ques: What did we get overhere-> Here we get a string ,behind the scene is handled by mongoose which gives us mongodb id
       const user= await User.aggregate([
        {
            $match:{//here we have to match field _id toh yaha ky hota h ki aggregation pipelines k jitna code that goes directly to mongodb
                //mongoose has no role to play in it therefore we need to make mongoose's object id
                _id:new mongoose.Types.ObjectId(req.user._id)
                //id match kr gya i.e we got our user

            }
        },
        //Lookup
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                //now we need to use a subpipeline or else we won't get details of owner from video collection
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",            //local collection mei dekh i.e videos k document i.e owner
                            foreignField:"_id",
                            as:"owner", //since ab owner ke andar user k pura data aa gya i.e avatar ,coverImage and all of that which we don't need to give
                            //we have to give only selected fields so we can apply one more pipeline for that
                            pipeline:[
                                {//user ka jo fields we want to include , flag 1 kr do us field ka
                                    $project:{//owner field ke inside hi project pipeline is gonna function
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }

                            }
                        ]
                        }
                        
                    },
                    //This pipeline is to ensure that frontend ko data lene mei convinience  ho
                    //lookup ke baad ,owner field mei data aaya ha in form of array , but we only give 0th value of array 
                    //therfore array pr loop avoid krne ke liye we are applying this pipeline
                    {
                        $addFields:{
                            //new name se bhi field add kr skte but here we are overriding owner field
                            owner:{
                                $first:"$owner" //since owner is a field so use $ before it to fetch value from it 
                                //$first will fetch first element of array of owner field

                            }
                        }

                    }
            ]
            }
        }
       ])

       return res
       .status(200)
       .json(
        new Apiresponse(
            200,
            user[0].getWatchHistory,
            "WatchHistory fetched successfully"
        )
       )
    })
 



export {registerUser,
    loginUser,
    logOutUser,
    refreshaccesstoken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}