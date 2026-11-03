import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import mechanicRoutes from "./routes/mechanicRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import getHelpRoutes from "./routes/getHelpRoutes.js";
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
// Mechanic routes
app.use("/api/mechanics", mechanicRoutes);

//request auth
app.use("/api/service-requests", serviceRequestRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// Get Help workflow mock stages
app.use("/api/get-help", getHelpRoutes);

export default app;
