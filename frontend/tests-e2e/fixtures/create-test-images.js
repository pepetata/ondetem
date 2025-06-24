// Run this script to create test image files for e2e tests
const fs = require("fs");
const path = require("path");

const fixturesDir = path.join(process.cwd(), "tests-e2e", "fixtures");

// Create fixtures directory if it doesn't exist
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Create simple 1x1 pixel test images (base64 encoded)
const testImageBase64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A";

// Convert base64 to buffer
const imageBuffer = Buffer.from(testImageBase64.split(",")[1], "base64");

// Create test image files
for (let i = 1; i <= 6; i++) {
  const filename = `test-image-${i}.jpg`;
  const filepath = path.join(fixturesDir, filename);
  fs.writeFileSync(filepath, imageBuffer);
  console.log(`Created ${filename}`);
}

// Create an invalid file for testing
const invalidFilePath = path.join(fixturesDir, "invalid-file.txt");
fs.writeFileSync(invalidFilePath, "This is not an image file");
console.log("Created invalid-file.txt");

console.log("Test fixtures created successfully!");
