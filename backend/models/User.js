import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
    {
        //Rgisterpage field
        fullName:{
            type:String,
            required:true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        mobile:{
            type:String,
            required:true,
            trim:true,
        },
        password:{
            type:String,
            required:true,
            minlength:8,
        },
        //LoginPage account type 
        role:{
            type:String,
            enum:["customer","mechanic"],
            default:"customer",
            required:true,
        },

    },
    {
        timestamps:true, // automatically adds two fields to each user document:
// - createdAt — the date and time the user record was created.
// - updatedAt — the date and time the record was last updated.
    }
);
const User = mongoose.model("User",userSchema);
export default User;