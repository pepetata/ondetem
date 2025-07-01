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
  if (authorization && authorization.toLowerCase().startsWith("bearer")) {
    if (authorization.toLowerCase().startsWith("bearer ")) {
      request.token = authorization.substring(7);
    } else {
      // Malformed bearer header (e.g., just "Bearer" without space)
      request.token = "";
    }
  } else {
    request.token = null;
  }
  next();
};

const userExtractor = async (request, response, next) => {
  console.log(`---- middleware userExtractor token:`, request.token);
  try {
    if (request.token) {
      const decodedToken = jwt.verify(request.token, process.env.JWT_SECRET);
      console.log(`---- middleware userExtractor decodedToken:`, decodedToken);
      if (decodedToken.userId) {
        const user = await User.getUserById(decodedToken.userId);
        console.log(
          `---- middleware userExtractor user:`,
          user ? `Found user ${user.email}` : "User not found"
        );

        request.user = user;
      } else {
        // No userId in token - delete the user property to make it undefined
        console.log(`---- middleware userExtractor: No userId in token`);
        delete request.user;
      }
    } else {
      console.log(`---- middleware userExtractor: No token provided`);
      // No token provided - delete the user property to make it undefined
      delete request.user;
    }
  } catch (error) {
    console.error(`Error in userExtractor: ${error}`);
    request.user = null;
  }
  next();
};

// ///////////////////////////////////////////////////// unknown Endpoint
const unknownEndpoint = (request, response) => {
  response.status(404).json({
    error: "unknown endpoint",
    message: "A página ou recurso solicitado não foi encontrado no servidor.",
  });
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

// Authentication middleware that requires a valid token and user
const authenticateToken = async (request, response, next) => {
  try {
    const authorization = request.get("authorization");
    if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
      return response.status(401).json({ error: "Token missing or invalid" });
    }

    const token = authorization.substring(7);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken.userId) {
      return response.status(401).json({ error: "Token invalid" });
    }

    const user = await User.getUserById(decodedToken.userId);
    if (!user) {
      return response.status(401).json({ error: "User not found" });
    }

    request.user = user;
    request.token = token;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return response.status(401).json({ error: "Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return response.status(401).json({ error: "Token expired" });
    }
    return response.status(401).json({ error: "Token validation failed" });
  }
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  authenticateToken,
};
