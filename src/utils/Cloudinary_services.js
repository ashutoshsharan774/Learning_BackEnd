import {v2 as cloudinary} from "cloudinary"
import fs from 'fs'
//The fs (file system) module in Node.js provides an API for interacting with the file system. It allows you to perform operations such as reading, writing, updating, and deleting files and directories.

// Configuration gives us permission for file upload
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDIANRY_API_SECRET
});

//Make a method where we will recieve path of local file and we'll upload file, if successfully uploaded then unlink the file
//try catch use krke banao as it is a bit tricky and as it takes time use async await

const uploadOnCloudinary=async(localFilePath)=>{
    try {
        if(!localFilePath){
            return null
        }
        //upload the file on cloudinary(cloudinary has a method called 'uploader' that uploads files)
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })//we get a lot of upload options || resource_type can be image,raw etc
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally saved temprorary file as the upload operation failed
        return null;
    }
}

export {uploadOnCloudinary}