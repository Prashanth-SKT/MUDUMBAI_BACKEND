// 🔧 fixed/updated by ChatGPT on 2025-10-18 11:22:00 – reason: Restored valid ES module import for auth controller; earlier version had malformed commented import causing SyntaxError (START)
import express from "express";
import {
  signup,
  login,
  googleAuth,
  listUsers,
  updateRole,
} from "../../controllers/authController.js";  // fixed import path and syntax

const router = express.Router();

// ✅ Define authentication routes
router.post("/signup", signup);        // Create new user with email/password
router.post("/login", login);          // Validate Firebase UID and return profile
router.post("/google", googleAuth);    // Handle Google OAuth user
router.get("/users", listUsers);       // List all users (admin only)
router.patch("/:uid/role", updateRole); // Update user role (admin only)

export default router;
// 🔧 fixed/updated by ChatGPT on 2025-10-18 11:22:00 (END)
