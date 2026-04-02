const express = require("express");
const router = express.Router();
const {
  createEvent,
  getMyClubEvents,
  getEventsForMyClubs,
  getEventById,
  updateEventAttendanceAndRewards,
  getFeedbackForMyClubs,
  submitEventFeedback,
  getClubPastEvents,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("faculty"), createEvent);
router.get("/my-events", protect, authorize("student"), getMyClubEvents);
router.get("/faculty-events", protect, authorize("faculty"), getEventsForMyClubs);
router.get("/faculty-feedback", protect, authorize("faculty"), getFeedbackForMyClubs);
router.get("/club/:clubId/past", getClubPastEvents);
router.post("/:id/feedback", protect, authorize("student"), submitEventFeedback);
router.get("/:id", protect, authorize("faculty"), getEventById);
router.patch(
  "/:id/attendance",
  protect,
  authorize("faculty"),
  updateEventAttendanceAndRewards
);

module.exports = router;
