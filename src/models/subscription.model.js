import mongoose,{Schema} from 'mongoose'

const subscriptionSchema =new Schema({
    subscriber:{ //since as we know subscribers and channels in subscription schema are also users so type waha se lo 
        type:Schema.Types.ObjectId, //one who is subscribing
        ref : "User"
    },
    channel:{
        type:Schema.Types.ObjectId, //one to whom 'subscriber' 
        // is subscribing
        ref : "User"
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)