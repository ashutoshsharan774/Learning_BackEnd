import mongoose ,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 
'mongoose-aggregate-paginate-v2';

// The mongoose-aggregate-paginate-v2 package is used for pagination with Mongoose's aggregation framework.

const commentSchema = new Schema(
    {
        content:{
            type:String,
            req:true
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"

        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }

)

commentSchema.plugin(mongooseAggregatePaginate)
//To add pagination functionality to your comment schema using the mongoose-aggregate-paginate plugin

export const Comment=mongoose.model("Comment",commentSchema)//db mei jakr Comment to lowercase and plural