class Apiresponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
}

export {Apiresponse}
/**
An HTTP status code is a message a website 's server sends to the browser to indicate whether or not that request can be fulfilled. Status codes specs are set by the W3C. Status codes are embedded in the HTTP header of a page to tell the browser the result of its request.
HTTP response status codes indicate whether a specific HTTP request has been successfully completed. Responses are grouped in five classes:

Informational responses (100 – 199)
Successful responses (200 – 299)
Redirection messages (300 – 399)
Client error responses (400 – 499)
Server error responses (500 – 599)



statusCode: A numeric value representing the status code of the API response.
data: The actual data or payload returned by the API.
message: An optional string parameter with a default value of "Success". This parameter is typically used to provide a human-readable message about the response.

this.statusCode = statusCode:
This assigns the value of the statusCode parameter to the statusCode property of the class instance.

this.data = data:
This assigns the value of the data parameter to the data property of the class instance.

this.message = message:
This assigns the value of the message parameter to the message property of the class instance.

this.success = statusCode < 400:
This creates a success property that is a boolean value. It is set to true if statusCode is less than 400, indicating a successful response (since HTTP status codes less than 400 typically indicate success), and false otherwise.

The Apiresponse class is a simple JavaScript (or TypeScript) class designed to standardize the structure of responses sent by a backend API to clients
 */

