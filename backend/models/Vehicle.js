import mongoose from "mongoose";
const vehicleSchema=new mongoose.Schema(
    {
        //CUSTOMERS VEHICLE
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        //vehicle infomation
        vehicleType: {
             type: String,
              required: true,
              enum: ["Car", "Bike", "Van", "Lorry", "Three Wheeler", "Other"],
          },
      //     brand: {
      // type: String,
      // required: true,
      // trim: true,
      //  },

        model: {
      type: String,
      required: true,
      trim: true,
    },
     registrationNumber: {
      type: String,
  
      unique: true,
      uppercase: true,
      trim: true,
    },
    //  fuelType: {
    //   type: String,
    //   enum: ["Petrol", "Diesel", "Electric", "Hybrid", "Other"],
    //   required: true,
    // },
  

     isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;



        
    
