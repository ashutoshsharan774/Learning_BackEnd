import mongoose,{Schema} from "mongoose";

const playlistSchema= new Schema(
    {
        name:{
            type:String,
            req:true
        },
        description:{
            type:String,
            req:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        videos:[//array of videos since a playlist contains more than one video
            {
            type:Schema.Types.ObjectId,
            ref:"Video"
            }
        ]

    },
    {

    }
)

export const Playlist= mongoose.model("Playlist",playlistSchema)