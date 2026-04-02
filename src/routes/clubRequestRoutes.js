const express = require("express");
const router = express.Router();
const {
  requestToJoin,
  getMyRequests,
  getRequestsForMyClubs,
  updateRequestStatus,
} = require("../controllers/clubRequestController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("student"), requestToJoin);
router.get("/my", protect, authorize("student"), getMyRequests);
router.get("/faculty", protect, authorize("faculty"), getRequestsForMyClubs);
router.patch("/:id", protect, authorize("faculty"), updateRequestStatus);

module.exports = router;
