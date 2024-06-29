//While connecting db we used async await and all those functionalities 
//So why not make a function and whenever I need to connecct to db we just
//need to pass through function and it will apply a wrapper there 
//Overall its a wrapper function
//Two approaches: 1)using promises  2)using async await

//Approach1
// Line 1: Declares the asyncHandler function which takes requestHandler as an argument.
// Line 2: Returns a new middleware function.
// Line 3: Inside this middleware function, requestHandler is called with req, res, and next, and wrapped in a resolved Promise.
// Line 4: If requestHandler throws an error or returns a rejected Promise, the error is caught and passed to the next middleware.

const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=> next(err))
    }
}


export {asyncHandler}

//Higher Order function : A higher-order function is a function that either takes one or more functions as arguments or returns a function as its result.
//  while witing code we just remove these curly braces
//agar fn ko async banana ho then write async before fn
//const asyncHandler=()=>{}
// const asyncHandler=(func)=>{()=>{}}
//const asyncHandler=(func)=> async()=>{}


//Approach2):async await
// const asyncHandler=(fn)=> async(req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(err.code ||500.json({
//             success:false,
//             message:err.message
//         }))

//     }
// }