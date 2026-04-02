require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const clubRoutes = require("./routes/clubRoutes");
const clubRequestRoutes = require("./routes/clubRequestRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ✅ Debug (optional)
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ✅ Middleware
app.use(morgan("dev"));

// 🔥 Proper CORS setup (IMPORTANT)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/club-requests", clubRequestRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Error handler
app.use(errorHandler);

module.exports = app;