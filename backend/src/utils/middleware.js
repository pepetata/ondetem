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
  console.log(`---- middleware userExtractor`, request.token);
  try {
    if (request.token) {
      const decodedToken = jwt.verify(request.token, process.env.JWT_SECRET);
      console.log(`---- middleware userExtractor decodedToken`, decodedToken);
      if (decodedToken.userId) {
        const user = await User.getUserById(decodedToken.userId);
        console.log(`---- middleware userExtractor user`, user);

        request.user = user;
      }
    }
  } catch (error) {
    console.error(`Error in userExtractor: ${error}`);
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
