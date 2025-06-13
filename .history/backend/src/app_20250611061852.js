const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
console.log("================ process.env.PORT:", process.env.PORT, PORT);

// Middleware (optional)
// app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
