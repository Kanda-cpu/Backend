import usermodel from "../model/usermodel.js";
import bcrpt from "bcrypt";
import { generatetoken } from "../utils/utils.js";

const logcontroller = async (req, res) => {
  try {
    const { email, loginpass } = req.body;

    const user = await usermodel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "user dosent exist",
      });
    }

    const validpass = await bcrpt.compare(loginpass, user.password);
    console.log(validpass);

    if (!validpass) {
      return res.status(404).json({
        message: "Invalid email or password",
      });
    }

    const { accesstoken, refreshtoken } = generatetoken({
      userid: user._id,
      email: user.email,
    });

    console.log("Access token -> ", accesstoken);
    console.log("Refresh token -> ", refreshtoken);

    await usermodel.findOneAndUpdate(user._id, {
      refreshtoken: refreshtoken,
    });

    res.status(200).json({
      message: "Logged in successfully",
      accesstoken: accesstoken,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Internal server error",
    });
  }
};

export default logcontroller;
