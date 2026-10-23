import express from 'express'
import dotenv from "dotenv";
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"

const app = express()

dotenv.config();

const MONGOURI=process.env.MONGOURI
const PORT=process.env.PORT||5000;

await connectDB();

app.get('/', (req,res) =>{
    res.send("sever is running")
})

app.listen(PORT, () => {
    console.log(`Server is Running on ${PORT}`)
})

app.use(express.json());
app.use("/api/auth",authRoutes);






