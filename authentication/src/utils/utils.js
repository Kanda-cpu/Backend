import jwt from "jsonwebtoken";
import configuri from "../config/configuri.js";

const generatetoken = (payload) => {
   
  const accesstoken = jwt.sign(payload, configuri.ACCESS_TOKEN, {
    expiresIn: "15m",
  });

  const refreshtoken = jwt.sign(payload, configuri.REFRESH_TOKEN, {
    expiresIn: "7d",
  });

  return { accesstoken, refreshtoken };
};

const verifyaccesstoken = (accesstoken) => {
  const verifiedaccesstoken = jwt.verify(accesstoken, configuri.ACCESS_TOKEN);
  return verifiedaccesstoken;
};

const verifyrefreshtoken = (refreshtoken) => {
  const verifiedrefreshtoken = jwt.verify(
    refreshtoken,
    configuri.REFRESH_TOKEN,
  );
  return verifiedrefreshtoken;
};

export { generatetoken, verifyaccesstoken, verifyrefreshtoken };
