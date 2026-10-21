const express =require("express");
const cors=require("cors");
require("dotenv").config();

const app =express();

//Middleware
app.use(cors());
app.use(express.json());

//Test api
app.get("/",(req,res)=>{
    res.send("Roadmate bakend id runnning");

});
 const PORT=process.env.PORT || 5000;
 