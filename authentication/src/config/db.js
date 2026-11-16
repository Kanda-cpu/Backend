import mongoose from "mongoose";
import configuri from "./configuri.js";

export async function dbconnection() {
  try {
    await mongoose.connect(configuri.MONGO_URI);
    console.log("Db connected Succesfully ");
  } catch (error) {
    console.log("Error in db connection ");
  }
}
