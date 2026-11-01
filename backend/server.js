
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();























// await connectDB();

// app.get('/', (req,res) =>{
//     res.send("sever is running")
// })

// app.listen(PORT, () => {
//     console.log(`Server is Running on ${PORT}`)
// });

// app.use(express.json());
// app.use("/api/auth",authRoutes);






