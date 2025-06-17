const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";
require("dotenv").config({ path: envFile });
const cors = require("cors");
const express = require("express");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads as static files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3000, () => {
    console.log(
      "Backend running on http://localhost:" + (process.env.PORT || 3000)
    );
  });
}

module.exports = app; // Export the app for testing purposes
