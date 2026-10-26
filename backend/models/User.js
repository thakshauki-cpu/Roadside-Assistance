import bcrypt from "bcryptjs";
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
        timestamps:true,               // automatically adds two fields to each user document:
                                     // - createdAt — the date and time the user record was created.
                                     // - updatedAt — the date and time the record was last updated.
    }
);

//Hash password before saving 
userSchema.pre("save",async function (){        //user data save aagurathukku munnadi indha function execute aagum endru artham.
    if(!this .isModified ("password"))return;      //password pudhusa set pannirukkomaa illa change pannirukkomaa endru check pannum; password change aagala endraal return moolama function-ai stop pannidum
                                                
    const salt=await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
});





const User = mongoose.model("User",userSchema);
export default User;