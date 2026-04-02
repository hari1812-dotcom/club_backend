const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendTokenResponse } = require("../utils/jwt");

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      role: role || "student",
    });

    sendTokenResponse(user, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Record login time in loginHistory
    user.loginHistory.push({
      loginAt: new Date(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    await user.save();

    sendTokenResponse(user, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token").json({ message: "Logged out" });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rewardPoints: user.rewardPoints,
    });
  } catch (err) {
    next(err);
  }
};

