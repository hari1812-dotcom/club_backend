require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const connectDB = require("./config/db");
const app = require("./app");

connectDB();
console.log("MONGO_URI:", process.env.MONGO_URI);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
