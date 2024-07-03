import { Router } from "express";
import { changeCurrentUserPassword,
     getCurrentUser,
     getUserChannelProfile,
     getWatchHistory,
     logOutUser,
     loginUser,
     refreshaccesstoken,
     registerUser,
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage } from "../controllers/user.controller.js";
//is tarah ka import tabhi ho skta ha jb export default na ho

import {upload} from "../middlewares/Multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router=Router()

//app.js se jaise hi /users hua then control is passed over here 
//then http://localhost:8000/api/v1/users ke aage /register lag jyega 
//as soon as /registers appends in url , registerUser method is called
router.route("/register").post(
    //middleware :jaate hue mujhese mil kr jana toh upload ko check krlenge before calling registerUser
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)


router.route("/login").post(loginUser) //agar is route pr aaye toh post method loginUser run krna chahiye

//securedRoutes || middleware inject kr do , ki logout hone se pahle i want to verify token
router.route("/logout").post( verifyJwt, logOutUser)

//endpoint for refreshtoken
router.route("/refresh-token").post(refreshaccesstoken)

//endpoint of changePassword:change-password is our url
router.route("/change-Password").post( verifyJwt,changeCurrentUserPassword)//ensure with help of verifyjwt ki logged in users hi changeCurrentPassword method ko post kr paaye

//endpoint of currentuser
router.route("/current-user").get(verifyJwt,getCurrentUser)

//endpoint for updating account details yaha patch route lagana h
//The PATCH method in HTTP is used to apply partial modifications to a resource. Unlike the PUT method, which typically updates the entire resource, PATCH is designed to update specific parts of a resource. This makes it more efficient for certain updates, as it allows clients to send only the changes rather than the complete resource.
router.route("/update-account-details").patch(verifyJwt,updateAccountDetails)

//endpoint for updation of useravatar
router
.route("/update-user-avatar")
.patch(verifyJwt,upload.single("avatar"),updateUserAvatar) //verifyJwt is our first middleware, 2nd middleware se upload(multer) krenge pahle new avatar ko then method call hoga

//endpoint for updation of user's coverImage //same as avatar
router.route("/update-coverImg").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage)

//endpoint for channel profile-> we are taking from params
/*
In the context of backend development, "params" (short for parameters) are values passed to an API endpoint to modify the request. They allow the client to specify additional information, which can be used to tailor the server's response. There are three main types of parameters: path parameters, query parameters, and body parameters. */
router.route("/channel/:username").get(verifyJwt,getUserChannelProfile)

//endpoint for watchHistory of user
router.route("/history").get(verifyJwt,getWatchHistory)





export default router