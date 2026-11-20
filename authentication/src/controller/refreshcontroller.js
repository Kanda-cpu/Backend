import usermodel from "../model/usermodel.js";
import bcrypt from "bcrypt";
import { generatetoken, verifyrefreshtoken } from "../utils/utils.js";

const refreshcontroller = async (req, res) => {
  try {
    // STEP 1: Extract refresh token from cookie
    const cookie_refreshtoken = req.cookies.refresh_token;

    if (!cookie_refreshtoken) {
      return res.status(401).json({
        message: "Refresh token not found",
      });
    }

    // STEP 2: Verify JWT signature and expiration
    const decoded_token = verifyrefreshtoken(cookie_refreshtoken);

    // STEP 3: Find user using decoded JWT payload
    const user = await usermodel.findById(decoded_token.userid);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // STEP 4: Check whether a refresh token exists in DB
    if (!user.refreshtoken) {
      return res.status(401).json({
        message: "Refresh token is invalid",
      });
    }

    // STEP 5: Compare incoming token with hashed DB token
    const isvalidtoken = await bcrypt.compare(
      cookie_refreshtoken,
      user.refreshtoken,
    );

    if (!isvalidtoken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    // STEP 6: Generate new access and refresh tokens
    const { accesstoken, refreshtoken } = generatetoken({
      userid: user._id,
      email: user.email,
    });

    // STEP 7: Hash the new refresh token
    const newhashed_refreshtoken = await bcrypt.hash(refreshtoken, 12);

    // STEP 8: Replace old hashed token in DB
    user.refreshtoken = newhashed_refreshtoken;
    await user.save();

    // STEP 9: Replace old cookie with new refresh token
    res.cookie("refresh_token", refreshtoken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // STEP 10: Send new access token
    return res.status(200).json({
      message: "New tokens generated successfully",
      accesstoken,
    });
  } catch (error) {
    console.log("Error in refresh API:", error);

    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};

export default refreshcontroller;
