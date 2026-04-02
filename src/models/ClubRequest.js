const mongoose = require("mongoose");

const clubRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    formResponseUrl: { type: String }, // removed required
    phone: { type: String },
    year: { type: Number },
    regNo: { type: String },
    reason: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

clubRequestSchema.index({ studentId: 1, clubId: 1 }, { unique: true });

module.exports = mongoose.model("ClubRequest", clubRequestSchema);