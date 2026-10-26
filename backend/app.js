import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();

//Middlewaree
app.use(cors());      //cors()  frontend-lirundhu backend API requests varuvatharku allow pannum.
app.use (express.json());


//Test route
app.get("/",(req,res)=>{
    res.send("Backend is running");
});

//Auth routes
app.use("/api/auth",authRoutes);

export default app;
