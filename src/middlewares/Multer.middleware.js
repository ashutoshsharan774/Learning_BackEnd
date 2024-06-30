import multer from "multer";
//read github doc of multer 
/*
 multer is a middleware for handling multipart/form-data, which is primarily used for uploading files in Node.js applications. One of the most common ways to handle file uploads using multer is by storing the files on disk.
 */
 const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.originalname) //originalname as filename is not a great idea as it is possible that 5 files with same name is there , so we may in future concept of unique_suffix for unique filename
    }
  })
  
//   The multer instance is created with the storage configuration.
   export const upload = multer({ 
    storage,
})











//   Configuring Disk Storage

// Destination: Specifies the directory where the uploaded files will be stored. Here, it's ./public/temp
// Filename: Generates a unique filename for each uploaded file to avoid naming conflicts. It combines the original field name, the current timestamp, and a random number.

/*
destination: The destination function takes three arguments: req (the request object), file (the file object), 
and cb (the callback function). The callback is called with null (indicating no error) and the directory where the files should be stored.

filename: The filename function also takes three arguments: req, file, and cb. It generates a unique suffix 
using the current timestamp and a random number, and then calls the callback with null and the constructed filename. */