import express from "express";
import regusercontroller from "../controller/regController.js";
import logcontroller from "../controller/logcontroller.js";
import authmiddleware from "../middleware/middleware.js";
import mecontroller from "../controller/mecontroller.js";
const router = express.Router();

router.post("/reg", regusercontroller);
router.post("/login", logcontroller);
router.get("/me", authmiddleware, mecontroller);

export default router;
