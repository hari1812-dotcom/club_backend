const Event = require("../models/Event");
const Club = require("../models/Club");
const Notification = require("../models/Notification");
const User = require("../models/User");
const EventFeedback = require("../models/EventFeedback");

// Faculty: create event (goes to admin for approval)
exports.createEvent = async (req, res, next) => {
  try {
    const { clubId, venue, date, description } = req.body;

    if (!clubId || !venue || !date || !description) {
      return res
        .status(400)
        .json({ message: "clubId, venue, date and description are required" });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (String(club.facultyIncharge) !== String(req.user.id)) {
      return res.status(403).json({ message: "You are not incharge of this club" });
    }

    const event = await Event.create({
      clubId,
      createdBy: req.user.id,
      venue,
      date: new Date(date),
      description,
    });

    // Notify all admins for approval
    const admins = await User.find({ role: "admin", isActive: true });
    await Promise.all(
      admins.map((admin) =>
        Notification.create({
          userId: admin._id,
          message: `New event submitted for approval for club ${club.name}`,
        })
      )
    );

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

// Student: events for my clubs (approved only)
exports.getMyClubEvents = async (req, res, next) => {
  try {
    const clubs = await Club.find({ members: req.user.id }).select("_id");
    const clubIds = clubs.map((c) => c._id);

    const events = await Event.find({
      clubId: { $in: clubIds },
      status: "Approved",
    })
      .populate("clubId", "name category")
      .populate("studentCoordinator", "name email")
      .sort({ date: 1 });

    const feedbacks = await EventFeedback.find({
      studentId: req.user.id,
      eventId: { $in: events.map((event) => event._id) },
    }).select("eventId");
    const feedbackEventIds = new Set(feedbacks.map((f) => String(f.eventId)));

    const studentEvents = events.map((event) => {
      const isCoordinator =
        event.studentCoordinator &&
        String(event.studentCoordinator._id || event.studentCoordinator) ===
          String(req.user.id);

      return {
        ...event.toObject(),
        memberRole: isCoordinator ? "Coordinator" : "Member",
        feedbackSubmitted: feedbackEventIds.has(String(event._id)),
      };
    });

    res.json(studentEvents);
  } catch (err) {
    next(err);
  }
};

// Faculty: events for clubs they manage
exports.getEventsForMyClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({ facultyIncharge: req.user.id }).select("_id");
    const clubIds = clubs.map((c) => c._id);

    const events = await Event.find({ clubId: { $in: clubIds } })
      .populate("clubId", "name")
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    next(err);
  }
};

// Faculty: get single event (for manage page)
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("clubId", "name members")
      .populate("studentCoordinator", "name email");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const clubId = event.clubId?._id || event.clubId;
    const club = await Club.findById(clubId);
    if (!club || String(club.facultyIncharge) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not your event" });
    }
    const members = await User.find({ _id: { $in: club.members }, role: "student" }).select("name email");
    res.json({ ...event.toObject(), clubMembers: members });
  } catch (err) {
    next(err);
  }
};

// Faculty: assign coordinator and mark attendance + reward points
exports.updateEventAttendanceAndRewards = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { coordinatorId, attendees } = req.body;
    // attendees: [{ studentId, present, points, reason }]

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const club = await Club.findById(event.clubId);
    if (!club || String(club.facultyIncharge) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (coordinatorId) {
      const studentUser = await User.findOne({
        _id: coordinatorId,
        role: "student",
        isActive: true,
      }).select("_id");
      if (!studentUser) {
        return res.status(400).json({ message: "Selected coordinator is invalid" });
      }
      event.studentCoordinator = coordinatorId;
      await Notification.create({
        userId: coordinatorId,
        message: `You have been assigned as Student Coordinator for event in ${club.name}`,
      });
    } else {
      event.studentCoordinator = undefined;
    }

    if (Array.isArray(attendees) && attendees.length > 0) {
      event.attendance = attendees.map((a) => ({
        student: a.studentId,
        present: !!a.present,
      }));

      // Update reward points
      await Promise.all(
        attendees.map(async (a) => {
          const pointsToAward = Number(a.points) || 0;
          const isClubMember = club.members.some(
            (memberId) => String(memberId) === String(a.studentId)
          );
          if (pointsToAward > 0 && !!a.present && isClubMember) {
            const student = await User.findById(a.studentId);
            if (!student) return;

            student.rewardPoints += pointsToAward;
            student.rewardHistory.push({
              event: event._id,
              points: pointsToAward,
              reason: a.reason || "participation",
            });
            await student.save();

            await Notification.create({
              userId: student._id,
              message: `You received ${pointsToAward} reward points for event in ${club.name}`,
            });
          }
        })
      );
    }

    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// Get past events for a club (last year)
exports.getClubPastEvents = async (req, res, next) => {
  try {
    const { clubId } = req.params;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const events = await Event.find({
      clubId,
      date: { $lt: new Date(), $gte: oneYearAgo },
      status: "Approved"
    })
      .populate("clubId", "name")
      .sort({ date: -1 })
      .limit(10);

    res.json(events);
  } catch (err) {
    next(err);
  }
};

// Faculty: view feedback for events in own clubs
exports.getFeedbackForMyClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({ facultyIncharge: req.user.id }).select("_id");
    const clubIds = clubs.map((c) => c._id);
    if (clubIds.length === 0) {
      return res.json([]);
    }

    const feedbacks = await EventFeedback.find({ clubId: { $in: clubIds } })
      .populate("studentId", "name email")
      .populate("eventId", "description date")
      .populate("clubId", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(feedbacks);
  } catch (err) {
    next(err);
  }
};

// Student: submit feedback for completed event
exports.submitEventFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, message } = req.body;

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be an integer from 1 to 5" });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Feedback message is required" });
    }

    const event = await Event.findById(id);
    if (!event || event.status !== "Approved") {
      return res.status(404).json({ message: "Event not found" });
    }
    if (new Date(event.date) > new Date()) {
      return res.status(400).json({ message: "Feedback can be submitted only after event completion" });
    }

    const club = await Club.findById(event.clubId).select("members facultyIncharge");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }
    const isMember = club.members.some((memberId) => String(memberId) === String(req.user.id));
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this event's club" });
    }

    const feedback = await EventFeedback.findOneAndUpdate(
      { eventId: event._id, studentId: req.user.id },
      {
        eventId: event._id,
        studentId: req.user.id,
        clubId: club._id,
        facultyId: club.facultyIncharge,
        rating: parsedRating,
        message: String(message).trim(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Notification.create({
      userId: club.facultyIncharge,
      message: "A student submitted feedback for a completed event",
    });

    res.status(201).json(feedback);
  } catch (err) {
    next(err);
  }
};

