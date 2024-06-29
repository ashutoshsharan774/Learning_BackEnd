class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=''
    ){
        //overriding constructor
        super(message)
        this.statusCode=statusCode
        this.data=nul
        this.message=message
        this.success=false;
        this.errors=errors

        //mostly written in production grade code
        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}

//streamlining api errors: basically standardized errors(api) ki agar error aaya toh isi format mei 
//Node.js provides us class Error (which contains constructor) aur override kr diya kuch methods ko

//The code above defines a custom error class called ApiError that extends the built-in Error class in JavaScript. This class is designed to handle API-specific errors by providing additional properties and default values to facilitate error handling in an application. 
/**
 * Constructor Parameters
statusCode: An HTTP status code that indicates the type of error (e.g., 404 for Not Found, 500 for Internal Server Error).
message: A custom error message (defaults to "Something went wrong").
errors: An array of additional error details (defaults to an empty array).
stack: The stack trace for the error (defaults to an empty string).

Properties
statusCode: Stores the HTTP status code.
data: A placeholder for any additional data related to the error (initially set to null).
message: Stores the error message.
success: Indicates whether the operation was successful (always set to false for this error).
errors: Stores any additional error details.
stack: Stores the stack trace of the error.

Error Handling
The class ensures that if a stack trace is not provided, it will capture the current stack trace using Error.captureStackTrace(this, this.constructor). This helps in debugging by showing where the error originated.
 */

// !!!!! IMPORTANT !!!!!!
// Method overriding in inheritance allows a subclass to provide a specific implementation for a method that is already defined in its superclass. This is a fundamental concept in object-oriented programming, enabling polymorphism and ensuring that the subclass can alter or extend the behavior of the superclass method.