import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

const router=express.Router(); //create for register route


//Register API 
router.post ("/register",async(req,res)=>{
    try{
        const {fullName,email,mobile,password,role}=req.body;
      //Check required fields
      if (!fullName ||!email || !mobile || !password){
        return res.status (400).json({
            message:"Please fill in all required fields.",
        });
      }

      //Validate password length 
      if (password.length <8){
        return res.status(400).json({
            message:"Password must contain at least 8 characters.",
        });
      }

      //Check whether the email already exists   //inga user.findone mainah use panni than  dbla email irrukka endu pakkuthu
       const existingUser = await User.findOne ({
        email: email.trim().toLowerCase(),
       });
       if (existingUser){
        return res.sendStatus(409).json({
            message:"An account with this email already exists.",

        });
       }
       //Hash the password before saving 
       const hashedPassword = await bcrypt.hash(password,10); //password i direct ah dbla store pannathu hash panni save pannum
      
       //Create the user in MongoDB    //user create use panni user details i mongo dbla save pannum
       const user = await User.create({
        fullName:fullName.trim(),
        email:email.trim().toLowerCase(),
        mobile:mobile.trim(),
        password:hashedPassword,
        role:role || "customer",

       });

       return res.status(201).json({
        message:"Account created successfully!",
        user:{
            id:user._id,
            fullName:user.fullName,
            email: user.email,
            mobile:user.mobile,
            role:user.role,

        },
       });



    }catch(error){
        console.error("Registration error:",error.message);
        if (error.code === 11000){
            return res.status(409).json({
                message:"An account with this email already exits.",

            });
        }
        return res.status(500).json({
            message:"Registration failed.Please try again.",
        });
    }
});