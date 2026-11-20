import usermodel from "../model/usermodel.js";

const mecontroller = async (req, res) => {
  try {
    // we have to access the userid becaues we have sent the userid in the payload at thr time of the token generation (req.user.userid)
    const user = await usermodel.findById(req.user.userid);

    if (!user) {
      return res.status(401).json({
        message: "logged-in user",
      });
    }

    // console.log("User details -> ", req.user.userid, "\n", req.user.email);

    //     const accesstoken = generatetoken({
    //   userid: user._id,
    //   email: user.email
    // });

    if (user) {
      res.status(200).json({
        message: "User Found",
        user: {
          id: req.user.userid,
          name: user.username,
          email: req.user.email,
        },
      });
    }
  } catch (error) {
    console.log("Error in the me controller -> ", error);

    return res.status(401).json({
      message: "Internal server error",
    });
  }
};

export default mecontroller;
