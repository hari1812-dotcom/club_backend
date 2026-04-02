const express = require("express");
const router = express.Router();
const {
  getClubs,
  getClubById,
  createClub,
  getMyClubs,
  getStudentClubs,
  getClubMembers,
} = require("../controllers/clubController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getClubs);
router.get("/my-clubs", protect, authorize("faculty"), getMyClubs);
router.get("/student-clubs", protect, authorize("student"), getStudentClubs);
router.get("/:id/members", protect, authorize("faculty"), getClubMembers);
router.get("/:id", getClubById);
router.post("/", protect, authorize("admin"), createClub);

module.exports = router;