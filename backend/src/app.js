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
const SecurityMiddleware = require("./middleware/securityMiddleware");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const adsRouter = require("./routes/ads");
const favoritesRouter = require("./routes/favorites");
const commentsRouter = require("./routes/comments");
const healthRouter = require("./routes/health");

const app = express();

// Apply comprehensive security middleware FIRST
SecurityMiddleware.applyAll(app);

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(middleware.requestLogger);
// app.use(middleware.tokenExtractor);
// app.use(middleware.userExtractor);

// Serve uploads as static files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/ads", adsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api", healthRouter);

app.use(middleware.unknownEndpoint);
app.use(SecurityMiddleware.errorHandler()); // Security error handler BEFORE general error handler
app.use(middleware.errorHandler);

if (process.env.NODE_ENV !== "test" || process.env.E2E === "true") {
  app.listen(process.env.PORT || 3000, () => {
    console.log(
      "Backend running on http://localhost:" + (process.env.PORT || 3000)
    );
  });
}

module.exports = app; // Export the app for testing purposes
