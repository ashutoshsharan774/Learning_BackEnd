 import mongoose,{Schema} from 'mongoose' //yahi pr Schema import krne pr baar baar mongoose.Schema likhne k need gaya
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

 const userSchema=new Schema (
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true //kisi bhi field ko searchable banana ha toh index true is better option
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            index:true,
            lowercase:true,
            trim:true,
        },
        avatar:{
            type:String, //cloudinary ka url use krenge(images,pdf save karo cloudinary pr and then wo us file ka url bana kr dega i.e in string)
            required:true,

        },
        coverImage:{
            type:String,
        },
        watchHistory:[ //depends on video's schema therfore we need to pass reference
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }    
    ],//watchHistory array ha
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String,
    }
 },
 {
    timestamps:true //we get createdAt , updatedAt
 }
)
//pre middleware hook:Pre middleware functions are executed one after another, when each middleware calls next.
//basically jaise hi koi data save hone ja rha , usse just pahle agar chahte h ki kuch action perform kare , we can do that using pre hook i.e encrypt kr de password

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next();//if passoword mei modification ni hua h then return next() else encrypt the password

    this.password= await bcrypt.hash(this.password,10) //before fields being saved encrypt password (hash function ke andar 2 values do ,1st value:thing to be encrypted, 2nd value:no. of rounds)
    next()
    //encryption of password takes time therefore await
    //a problem arises , jab bhi koi dusri field apart from password is changed , toh uske save hone se pahle ye password phir encrypt kr dega so we need to
    //specify that change and encrypt password only when there is any modification in password field (har bar password encrypt ni krna )
})
//save hone se pahle callback fire kr do(don't use arow function as we don't have 'this' keyword in arrow function so we won't be able to get the current context)
//Mongoose mei jakr docs mei then go to middleware and check for the types of hooks and events on which they can be applied(like validate ,save etc)
//encryption is time taking process therefore use async function 


//Method banana pdega so that jb bhi hm user import kraye toh puch le ki whether password is correct or not
//Mongoose provide provision of injecting methods , here we are gonna create our own custom method
//userSchema provides methods , methods provide some fn if our required fn isn't there then we can create our own fn
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
    //bcrypt has a compare function , it compares the given password by user and the encrypted password which user created while signing up
}

//Method to generate access_Token and refresh_token(both of them are jwt tokens ,will serve different purpose)
userSchema.methods.generateAccessToken=function(){
    jwt.sign(
        {
            //payload
        id: this.id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)  //jwt has sign method that generates token
    //jwt.sign() is a method provided by the jsonwebtoken library in Node.js, which is used to create JSON Web Tokens (JWTs)
    /**
     * Parameters
The jwt.sign() method accepts the following parameters:

payload: The payload to encode into the JWT. This can be any JSON object, but keep in mind that the payload will be visible to anyone who has the token. Sensitive information should not be included here unless the token is encrypted.

secretOrPrivateKey: A secret key or private key to sign the JWT. The secret key is used for HMAC algorithms, and the private key is used for RSA and ECDSA algorithms.

options (optional): An object containing additional options, such as:

algorithm: The algorithm to use for signing the token (default: HS256).
expiresIn: The expiration time of the token (e.g., '1h', '2d', etc.).
notBefore: The time before which the token is not valid (e.g., '10m', '1h', etc.).
audience: The audience claim (aud).
issuer: The issuer claim (iss).
jwtid: The JWT ID claim (jti).
subject: The subject claim (sub).
     */

}
userSchema.methods.generateRefreshToken=function(){
    jwt.sign(
        {
            //payload , since it keeps getting refreshed so less payload
        id: this.id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
) 
}



 export const User= mongoose.model('User',userSchema)//userSchema ko refer krke user banana hai



 
 
 
 
 //bcrypt: A library to help you hash passwords.bcrypt is a password hashing function designed to help secure stored passwords
//bcrypt is based on the Blowfish block cipher and uses a modified key setup algorithm. This makes it resistant to cryptographic attacks.

//jwt:A JSON Web Token (JWT) is a way to securely transmit information between two parties, like between a server and a client, in a compact and self-contained format. Think of it as a digital ID card that you can carry around on the web.
// JWT is a bearer token mtlb jo bhi request we give to server if it holds jwt token then service is provided by server

/**How It Works:
Issuing the Token: When you log in to a website, the server verifies your credentials and then creates a JWT. This token contains your user ID and some other info.
Using the Token: This token is then sent to your browser. Every time you make a request to the server, like viewing a profile or making a purchase, your browser includes this token.
Verifying the Token: The server checks the token to ensure it's valid and then processes your request. */ 
// In summary, JWTs are like secure, efficient, and self-contained digital ID cards that help ensure safe and smooth interactions on the web.

