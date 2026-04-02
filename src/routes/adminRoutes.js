const express = require("express");
const router = express.Router();
const {
  getUsers,
  updateUserStatus,
  getEventsForApproval,
  updateEventStatus,
  getDashboardStats,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.patch("/users/:id", updateUserStatus);
router.get("/events", getEventsForApproval);
router.patch("/events/:id", updateEventStatus);

module.exports = router;
