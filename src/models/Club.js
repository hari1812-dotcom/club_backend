const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: ["Technical", "Cultural & Creative", "Social", "Civic"],
      required: true,
    },
    description: { type: String, required: true },
    equipment: [{ type: String }],
    formUrl: { type: String },
    facultyIncharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    maxCapacity: { type: Number, default: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Club", clubSchema);

