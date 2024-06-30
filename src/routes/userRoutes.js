import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
//is tarah ka import tabhi ho skta ha jb export default na ho

import {upload} from "../middlewares/Multer.middleware.js"


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


export default router