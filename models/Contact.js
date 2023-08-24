import mongoose, { Schema } from "mongoose";



const Schemas = new Schema({
    user_id:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    contact:{
        type:String,
        required:true
    },
    email:{
        type:String,
        default:true
    }
},{timestamp:true});

const userContact  = mongoose.model("userContact",Schemas);


export default userContact;