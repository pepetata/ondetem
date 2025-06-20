const jwt = require("jsonwebtoken");
const logger = require("./logger");
const User = require("../models/userModel");

const requestLogger = (request, response, next) => {
  if (process.env.NODE_ENV !== "test") {
    logger.info(`Method: ${request.method || "undefined"}`);
    logger.info(`Path:   ${request.path || "undefined"}`);
    logger.info(`Body:   ${JSON.stringify(request.body)}`);
    logger.info("---");
  }
  next();
};

const tokenExtractor = (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    request.token = authorization.substring(7);
  } else {
    request.token = null;
  }
  next();
};

const userExtractor = async (request, response, next) => {
  try {
    if (request.token) {
      const decodedToken = jwt.verify(request.token, process.env.SECRET);
      // console.log(`---- middleware userExtractor decodedToken`, decodedToken);
      if (decodedToken.id) {
        const user = await User.getUserById(decodedToken.id);
        // console.log(`---- middleware userExtractor user`, user);

        request.user = user;
      }
    }
  } catch (error) {
    request.user = null;
  }
  next();
};

// ///////////////////////////////////////////////////// unknown Endpoint
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

// ///////////////////////////////////////////////////// error handler
const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "invalid token" });
  } else if (error.name === "TokenExpiredError") {
    return response.status(401).json({ error: "token expired" });
  }

  next(error);
};
module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
