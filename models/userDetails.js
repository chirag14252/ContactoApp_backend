import { Schema } from "mongoose";
import mongoose from "mongoose";

const user = new Schema({
    name:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        unique:true
    }
},{timestamps:true})

const userModels = mongoose.model("user",user);

export default userModels;
