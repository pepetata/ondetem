const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";
require("dotenv").config({ path: envFile });
const cors = require("cors");
const express = require("express");
const path = require("path");
const morgan = require("morgan");

const middleware = require("./utils/middleware");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const adsRouter = require("./routes/ads");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(middleware.requestLogger);
// app.use(middleware.tokenExtractor);
// app.use(middleware.userExtractor);

// Serve uploads as static files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/ads", adsRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(process.env.PORT || 3000, () => {
    console.log(
      "Backend running on http://localhost:" + (process.env.PORT || 3000)
    );
  });
}

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app; // Export the app for testing purposes
