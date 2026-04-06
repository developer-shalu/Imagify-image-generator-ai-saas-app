import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};


// const connectDB = async () => {
//     mongoose.connection.on('connected', () => {
//         console.log('Database connected successfully');
//     })

//     await mongoose.connect(`${process.env.MONGODB_URI}/imagify`)
// }

export default connectDB;