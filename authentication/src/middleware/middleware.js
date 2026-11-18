import { verifyaccesstoken } from "../utils/utils.js";

// Authentication middleware
// This middleware runs before protected route controllers.
// Its responsibility is to verify the access token and identify the requester.

const authmiddleware = (req, res, next) => {
  try {
    // STEP 1: Extract the Authorization header from the incoming request.
    // The client sends the access token in this format:
    // Authorization: Bearer <access_token>
    //
    // We use req because Authorization is information sent BY the client.
    // res is used to send information BACK to the client.
    const accesstokenheader = req.headers.authorization;

    // STEP 2: Check whether the Authorization header exists.
    // If it doesn't exist, the client hasn't provided an access token.
    // Return 401 Unauthorized because authentication is required.
    //
    // We use return so the middleware stops executing immediately.
    // The next middleware/controller will NOT execute.

    if (!accesstokenheader) {
      return res.status(401).json({
        message: "Access token is required for authentication ",
      });
    }

    if (!accesstokenheader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // STEP 3: Extract the authentication scheme and the actual token.
    // Expected format: "Bearer <token>"
    //
    // split(" ") separates the string into parts:
    // ["Bearer", "<token>"]
    //
    // We need to validate the structure before using the token.

    // STEP 4: Validate the Authorization header.
    // The scheme must be Bearer (case-insensitive).
    // A token must exist.
    // Additional unexpected parts are rejected.
    //
    // This prevents malformed Authorization headers from being
    // passed to the JWT verification utility.

    const token = accesstokenheader.split(" ")[1];

    // STEP 5: Verify the access token using our existing utility.
    //
    // verifyaccesstoken() internally uses jwt.verify() with
    // our ACCESS_TOKEN secret.
    //
    // It checks the JWT signature and expiration.
    //
    // If verification succeeds, it returns the decoded payload.
    // If verification fails, it throws an error which is handled
    // by the catch block below.

    const decodedtoken = verifyaccesstoken(token);

    // STEP 6: Attach the verified user information to the request.
    //
    // req.user is a custom property that we create ourselves.
    // Express doesn't provide it automatically.
    //
    // We attach the verified JWT payload so that downstream
    // middleware and controllers can access the authenticated
    // user's information without verifying the token again.
    //
    // Example:
    // req.user.userid
    // req.user.email

    req.user = decodedtoken;

    // STEP 7: Pass control to the next middleware or route controller.
    //
    // Calling next() tells Express that authentication succeeded
    // and request processing can continue.
    //
    // If next() isn't called and no response is sent,
    // the request will remain unfinished.

    next();
  } catch (error) {
    console.log("Error in the auth middleware", error);
    return res.status(401).json({
      message: "Internal server error",
    });
  }
};

export default authmiddleware;
