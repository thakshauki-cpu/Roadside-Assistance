import jwt from "jsonwebtoken";
export const protect =(req,res,next)=>{
    const header =req.headers.authorization;

//Check whether token is provided
if (!header||!header.startsWith("Bearer")){
    return res.status(401).json({
        message:"Not authorized,no token provided",
    });
}

try{
    //Extract token from Authorization header
    const token =header.split(" ")[1];
    //Verify token
    const decoded=jwt.verify(
        token,
        process.env.JWT_SECRET
    );

//Store user ID in request
req.user = decoded.id;

//Continue to the next function 
return next();

}
catch(error){
    return res.status(400).json({
        message:"Not authorized,token is invalid or expired",
    });



}


};