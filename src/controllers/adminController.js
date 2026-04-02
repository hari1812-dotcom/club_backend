const User = require("../models/User");
const Event = require("../models/Event");
const Club = require("../models/Club");
const Notification = require("../models/Notification");

// Admin: list users with optional role filter
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select("name email role isActive rewardPoints loginHistory")
      .lean();

    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Admin: activate / deactivate user
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("name email role isActive");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Admin: events by status
exports.getEventsForApproval = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate("clubId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    next(err);
  }
};

// Admin: approve or reject
exports.updateEventStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const eventId = req.params.id;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = status;
    event.rejectionReason = rejectionReason;
    await event.save();

    const club = await Club.findById(event.clubId);

    // Notify faculty creator
    await Notification.create({
      userId: event.createdBy,
      message:
        status === "Approved"
          ? `Your event for club ${club?.name || ""} has been approved`
          : `Your event for club ${club?.name || ""} has been rejected${
              rejectionReason ? `: ${rejectionReason}` : ""
            }`,
    });

    if (status === "Approved") {
      // Notify students of this club
      const members = club ? club.members : [];
      await Promise.all(
        members.map((studentId) =>
          Notification.create({
            userId: studentId,
            message: `New approved event in ${club.name}`,
          })
        )
      );
    }

    res.json(event);
  } catch (err) {
    next(err);
  }
};

// Admin: dashboard stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [totalStudents, totalFaculty, totalClubs, pendingEvents, approvedEvents] =
      await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "faculty" }),
        Club.countDocuments(),
        Event.countDocuments({ status: "Pending" }),
        Event.countDocuments({ status: "Approved" }),
      ]);

    const now = new Date();
    const activeEvents = await Event.countDocuments({
      status: "Approved",
      date: { $gte: now },
    });

    // Participation stats from attendance & rewards
    const eventsWithAttendance = await Event.find({
      "attendance.present": true,
    }).populate("clubId", "name");

    const participationCount = eventsWithAttendance.reduce(
      (sum, ev) =>
        sum +
        ev.attendance.filter((a) => a.present).length,
      0
    );

    // Most active club by attendance
    const clubParticipationMap = {};
    eventsWithAttendance.forEach((ev) => {
      const clubId = ev.clubId?._id?.toString();
      if (!clubId) return;
      const count = ev.attendance.filter((a) => a.present).length;
      clubParticipationMap[clubId] = (clubParticipationMap[clubId] || 0) + count;
    });

    let mostActiveClub = null;
    let maxClubParticipation = 0;
    Object.entries(clubParticipationMap).forEach(([clubId, count]) => {
      if (count > maxClubParticipation) {
        maxClubParticipation = count;
        mostActiveClub = eventsWithAttendance.find(
          (ev) => ev.clubId && ev.clubId._id.toString() === clubId
        )?.clubId;
      }
    });

    // Most active student by reward points
    const mostActiveStudent = await User.findOne({ role: "student" })
      .sort({ rewardPoints: -1 })
      .select("name email rewardPoints")
      .lean();

    res.json({
      totalStudents,
      totalFaculty,
      totalClubs,
      totalActiveEvents: activeEvents,
      totalPendingEvents: pendingEvents,
      totalApprovedEvents: approvedEvents,
      participationCount,
      mostActiveClub,
      mostActiveStudent,
    });
  } catch (err) {
    next(err);
  }
};

