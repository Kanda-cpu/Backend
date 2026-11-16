import express from "express";
import authenticateuser from "../middleware/auth.middleware.js";
import regusercontroller from "../controller/regController.js";

const router = express.Router();

router.post("/reg",  regusercontroller);

export default router;
