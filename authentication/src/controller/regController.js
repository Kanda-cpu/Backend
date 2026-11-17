import usermodel from "../model/usermodel.js";
import {
  generatetoken,
  verifyaccesstoken,
  verifyrefreshtoken,
} from "../utils/utils.js";
import bcrypt from "bcrypt";

const regusercontroller = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existinguser = await usermodel.findOne({ email });

    if (existinguser) {
      return res.status(409).json({
        message: "User already exist",
      });
    }

    const newuser = await usermodel.create({
      username: username,
      email: email,
      password: await bcrypt.hash(password, 12),
    });

    const { accesstoken } = generatetoken({
      userId: newuser._id,
      email: newuser.email,
    });

    console.log(accesstoken);

    res.status(201).json({
      message: "User registered succesfully",
      accesstoken: accesstoken,
    });
  } catch (error) {
    res.status(401).json({
      message: "Internal server error",
    });
    console.log("Error in the register api");
  }
};

export default regusercontroller;
