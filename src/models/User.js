const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    loginAt: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
  },
  { _id: false }
);

const rewardHistorySchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    points: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["participation", "organizer", "winner"],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "student",
    },
    yearOfStudy: { type: Number, default: 1 },
    department: { type: String },
    phone: { type: String },
    rewardPoints: { type: Number, default: 0 },
    rewardHistory: [rewardHistorySchema],
    loginHistory: [loginHistorySchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

