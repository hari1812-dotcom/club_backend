require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Club = require("../models/Club");

const categories = {
  Technical: ["Code Circle Club", "Math Club", "Science Club", "FOSS Club"],
  "Cultural & Creative": [
    "Fine Arts Club",
    "Music Club",
    "Photo Hub",
    "Muthamizh Mandram",
  ],
  Social: [
    "Community Service Club",
    "YRC",
    "Rotaract Club",
    "UBA",
    "Leo Club",
  ],
  Civic: [
    "Women Development Cell",
    "Great Minds Club",
    "Geo Club",
    "Yoga Club",
  ],
};

const clubDetails = {
  "Code Circle Club": {
    description: "A club for coding enthusiasts. We conduct hackathons, coding competitions, and hands-on workshops on programming languages and development tools. Join to build projects and compete at inter-college events.",
    equipment: ["Laptops", "Projector", "Whiteboard", "Coding platforms (online)", "Wi-Fi"],
  },
  "Math Club": {
    description: "For students who love mathematics. We focus on problem-solving, Olympiad preparation, and mathematical modelling. Regular sessions and practice tests for competitive exams.",
    equipment: ["Whiteboard", "Projector", "Reference books", "Problem sets", "Graphing tools"],
  },
  "Science Club": {
    description: "Explore science through experiments, science fairs, and guest lectures. We cover physics, chemistry, and biology with hands-on activities and project exhibitions.",
    equipment: ["Lab equipment", "Projector", "Models & charts", "Safety gear", "Chemicals (supervised)"],
  },
  "FOSS Club": {
    description: "Free and Open Source Software club. Learn to contribute to open source projects, use Linux, and participate in community-driven development and events.",
    equipment: ["Laptops", "Projector", "GitHub/organisation access", "Linux workstations"],
  },
  "Fine Arts Club": {
    description: "For painting, sketching, and visual arts. We hold exhibitions, workshops, and collaborative art projects. All skill levels welcome.",
    equipment: ["Canvas", "Brushes", "Paints (acrylic, watercolour)", "Easels", "Sketch pads", "Pencils & charcoal"],
  },
  "Music Club": {
    description: "Learn and perform music. We have practice sessions, band performances, and cultural events. Instruments are available for use during club hours.",
    equipment: ["Guitar (acoustic & electric)", "Piano", "Keyboard", "Drums", "Tabla", "Microphone", "Amplifier", "Sound system"],
  },
  "Photo Hub": {
    description: "Photography and photo editing club. Covers basics to advanced techniques, photo walks, and exhibitions. Use club equipment for assignments and projects.",
    equipment: ["DSLR cameras", "Tripods", "Editing software (license)", "Studio lights", "Backdrops", "Reflectors"],
  },
  "Muthamizh Mandram": {
    description: "Tamil literature, drama, and cultural activities. We organise drama rehearsals, literary events, and stage performances for college and inter-college festivals.",
    equipment: ["Sound system", "Stage lights", "Costumes", "Props", "Microphones", "Green room"],
  },
  "Community Service Club": {
    description: "Volunteering and community outreach. We organise blood donation camps, village visits, and awareness drives. Make a difference while building leadership skills.",
    equipment: ["Projector", "Banners & posters", "First aid kits", "Volunteer kits", "Megaphone"],
  },
  "YRC": {
    description: "Youth Red Cross unit. First aid training, health awareness, and disaster preparedness programmes. Certifications and camps in partnership with Red Cross.",
    equipment: ["First aid kits", "Projector", "Training mannequins", "Banners", "Health pamphlets"],
  },
  "Rotaract Club": {
    description: "Rotaract focuses on community service, professional development, and leadership. Joint projects with Rotary, fundraising events, and skill workshops.",
    equipment: ["Projector", "Banners", "Event kits", "Sound system"],
  },
  "UBA": {
    description: "Unnat Bharat Abhiyan – connecting with rural communities. Surveys, awareness programmes, and technical solutions for village development.",
    equipment: ["Projector", "Survey tools", "Banners", "Laptops", "Cameras"],
  },
  "Leo Club": {
    description: "Leadership, Experience, Opportunity. Youth wing of Lions Club. Community service, leadership workshops, and international exchange opportunities.",
    equipment: ["Projector", "Banners", "Event kits", "Sound system"],
  },
  "Women Development Cell": {
    description: "Empowerment, safety, and career guidance for women. Workshops on legal awareness, self-defence, and skill development. Safe space for discussions and mentorship.",
    equipment: ["Projector", "Whiteboard", "Resource materials", "First aid", "Library"],
  },
  "Great Minds Club": {
    description: "Debates, quizzes, and critical thinking. We host inter-college quizzes, debate competitions, and group discussions. Build confidence and reasoning skills.",
    equipment: ["Projector", "Buzzer system", "Whiteboard", "Timer", "Microphones"],
  },
  "Geo Club": {
    description: "Geography and environment club. Map reading, GIS basics, field trips, and awareness on climate and sustainability. Guest lectures and documentary screenings.",
    equipment: ["Maps & atlases", "Projector", "Models (globe, terrain)", "GPS devices", "Charts"],
  },
  "Yoga Club": {
    description: "Yoga and meditation for fitness and mental wellness. Regular sessions, meditation workshops, and participation in yoga day and sports events.",
    equipment: ["Yoga mats", "Meditation cushions", "Sound system", "Mirrors", "First aid"],
  },
};

// ── 4 Faculty mapped to their categories ─────────────────────────────────────
const FACULTY = [
  { name: "Dr. Suvathi", email: "suvathi@college.edu", password: "Faculty@123", category: "Technical", department: "Computer Science", phone: "+91-9876543210" },
  { name: "Dr. Meena",   email: "meena@college.edu",   password: "Faculty@123", category: "Cultural & Creative", department: "Fine Arts", phone: "+91-9876543211" },
  { name: "Dr. Ramesh",  email: "ramesh@college.edu",  password: "Faculty@123", category: "Social", department: "Sociology", phone: "+91-9876543212" },
  { name: "Dr. Priya",   email: "priya@college.edu",   password: "Faculty@123", category: "Civic", department: "Political Science", phone: "+91-9876543213" },
];

async function seed() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || "club_membership_manager",
  });

  // ── Admin ─────────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash("admin123", 10);
  let admin = await User.findOne({ email: "admin@college.edu" });
  if (!admin) {
    admin = await User.create({
      name: "Admin",
      email: "admin@college.edu",
      password: hashed,
      role: "admin",
    });
    console.log("✅ Admin created: admin@college.edu / admin123");
  } else {
    console.log("⚠️  Admin already exists");
  }

  // ── Student ───────────────────────────────────────────────────────────────
  const studentPass = await bcrypt.hash("student123", 10);
  let student = await User.findOne({ email: "student@college.edu" });
  if (!student) {
    student = await User.create({
      name: "John Doe",
      email: "student@college.edu",
      password: studentPass,
      role: "student",
    });
    console.log("✅ Student created: student@college.edu / student123");
  } else {
    console.log("⚠️  Student already exists");
  }

  // ── 4 Faculty ─────────────────────────────────────────────────────────────
  const facultyMap = {}; // category → user
  for (const f of FACULTY) {
    let user = await User.findOne({ email: f.email });
    if (!user) {
      const fp = await bcrypt.hash(f.password, 10);
      user = await User.create({
        name: f.name,
        email: f.email,
        password: fp,
        role: "faculty",
        department: f.department,
        phone: f.phone,
      });
      console.log(`✅ Faculty created: ${f.email} / ${f.password}`);
    } else {
      console.log(`⚠️  Faculty already exists: ${f.email}`);
    }
    facultyMap[f.category] = user;
  }

  // ── Predefined Students ───────────────────────────────────────────────────
  const predefinedStudents = [];
  const studentPassHash = await bcrypt.hash("student123", 10);
  for (let i = 1; i <= 200; i++) {
    const email = `student${i}@college.edu`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: `Student ${i}`,
        email,
        password: studentPassHash,
        role: "student",
        yearOfStudy: (i % 4) + 1,
        department: ["CSE", "IT", "ECE", "MECH"][i % 4],
        phone: `987654321${i % 10}`,
      });
      console.log(`✅ Predefined Student created: ${email}`);
    } else {
      console.log(`⚠️  Predefined Student already exists: ${email}`);
    }
    predefinedStudents.push(user);
  }

  // ── Clubs ─────────────────────────────────────────────────────────────────
  let studentIndex = 0;
  for (const [category, names] of Object.entries(categories)) {
    const facultyUser = facultyMap[category]; // correct faculty for this category
    for (const name of names) {
      const details = clubDetails[name] || {
        description: `${name} – College club for students.`,
        equipment: [],
      };
      
      const clubMembers = [];
      for (let k = 0; k < 10; k++) {
        clubMembers.push(predefinedStudents[(studentIndex + k) % 200]._id);
      }
      studentIndex += 10;

      const exists = await Club.findOne({ name });
      if (exists) {
        await Club.updateOne(
          { name },
          {
            description: details.description,
            equipment: details.equipment,
            category,
            facultyIncharge: facultyUser._id,
            maxCapacity: 50,
            members: clubMembers,
          }
        );
        console.log(`🔄 Club updated: ${name} → ${facultyUser.name} with predefined members`);
      } else {
        await Club.create({
          name,
          category,
          description: details.description,
          equipment: details.equipment,
          facultyIncharge: facultyUser._id,
          maxCapacity: 50,
          members: clubMembers,
        });
        console.log(`✅ Club created: ${name} → ${facultyUser.name} with predefined members`);
      }
    }
  }

  console.log("\n🎉 Seed done!");
  console.log("─────────────────────────────────────");
  console.log("Admin:   admin@college.edu / admin123");
  console.log("Student: student@college.edu / student123");
  console.log("─────────────────────────────────────");
  FACULTY.forEach(f => console.log(`Faculty: ${f.email} / ${f.password}  [${f.category}]`));
  console.log("─────────────────────────────────────");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});