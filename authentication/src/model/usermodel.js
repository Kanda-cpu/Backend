import mongoose from "mongoose";

const userschema = new mongoose.Schema(
  {
    username: {
      type: String,
      minlength: [3, "Minimum of 3 characters are required"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
    refreshtoken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const usermodel = mongoose.model("Practice_user", userschema);
export default usermodel;
