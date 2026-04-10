const express = require("express");
const router = express.Router();
const {
  studentSendOtp,
  studentVerifyOtp,
  adminLogin,
  refreshToken,
  logout,
  getMe,
  updateProfile,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.post("/student/send-otp", studentSendOtp);
router.post("/student/verify-otp", studentVerifyOtp);
router.post("/admin/login", adminLogin);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);

module.exports = router;
