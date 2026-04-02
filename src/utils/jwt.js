const jwt = require("jsonwebtoken");

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production. Add it to your .env file.");
  }
  return "club-membership-manager-dev-secret-change-in-production";
};

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendTokenResponse = (user, res) => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .cookie("token", token, cookieOptions)
    .json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rewardPoints: user.rewardPoints,
      },
    });
};

module.exports = { generateToken, sendTokenResponse, getSecret };

