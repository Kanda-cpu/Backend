import { verifyaccesstoken } from "../utils/utils.js";

const authenticateuser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token not found ",
      });
    }

    if (!authHeader.startsWith("Bearer")) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    const token = authHeader.split(" ")[1];

    const decode = verifyaccesstoken(token);

    req.user = decode;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Token not found",
    });
  }
};

export default authenticateuser