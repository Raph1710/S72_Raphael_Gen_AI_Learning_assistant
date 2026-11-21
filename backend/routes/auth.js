import express from "express";
import { signup, login, logout, profile, googleAuth } from "../controller/userController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/logout", authMiddleware, logout);
router.get("/profile", authMiddleware, profile);

export default router;