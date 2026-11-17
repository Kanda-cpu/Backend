import express from "express";
import authenticateuser from "../middleware/auth.middleware.js";
import regusercontroller from "../controller/regController.js";
import logcontroller from "../controller/logcontroller.js";
const router = express.Router();

router.post("/reg", regusercontroller);
router.post("/login", logcontroller);

export default router;
