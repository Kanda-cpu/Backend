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

    if (!validpass) {
      return res.status(404).json({
        message: "Invalid email or password",
      });
    }

    const { accesstoken, refreshtoken } = generatetoken({
      userid: user._id,
      email: user.email,
    });
    // console.log("Refresh token -> ", refreshtoken);
    // console.log("Access token -> ", accesstoken);

    // set the refreshtoken in the cookie

    res.cookie("refresh_token", refreshtoken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // update the refreshtoken in the database
    // await usermodel.findOneAndUpdate({
    //   _id: user._id,
    // },{refreshtoken:refreshtoken});

    // we already have the users data so we can add it directly to the users doc
    user.refreshtoken = await bcrpt.hash(refreshtoken, 12);
    await user.save();

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
