import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

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
//Dashboard routes
app.use("/api/dashboard", dashboardRoutes);

//request auth
app.use("/api/service-requests", serviceRequestRoutes);

export default app;
