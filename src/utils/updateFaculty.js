const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function updateFaculty() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/club_membership";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const facultyUpdates = [
      { email: "suvathi@college.edu", department: "Computer Science", phone: "+91-9876543210" },
      { email: "meena@college.edu", department: "Fine Arts", phone: "+91-9876543211" },
      { email: "ramesh@college.edu", department: "Sociology", phone: "+91-9876543212" },
      { email: "priya@college.edu", department: "Political Science", phone: "+91-9876543213" },
    ];

    for (const update of facultyUpdates) {
      const result = await User.updateOne(
        { email: update.email },
        { department: update.department, phone: update.phone }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated faculty: ${update.email}`);
      } else {
        console.log(`⚠️  No changes for: ${update.email}`);
      }
    }

    console.log("Faculty update completed");
  } catch (error) {
    console.error("Error updating faculty:", error);
  } finally {
    await mongoose.disconnect();
  }
}

updateFaculty();