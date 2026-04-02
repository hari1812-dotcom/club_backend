const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function checkFaculty() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/club_membership";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const faculty = await User.find({ role: "faculty" }, "name email department phone");
    console.log("Current faculty data:");
    faculty.forEach(f => {
      console.log(`${f.name}: ${f.email} | Dept: ${f.department} | Phone: ${f.phone}`);
    });

  } catch (error) {
    console.error("Error checking faculty:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkFaculty();