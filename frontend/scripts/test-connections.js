const axios = require("axios");

// Quick test to verify backend connectivity and TMDB API
async function testConnections() {
  console.log("🔍 Testing connections...\n");

  // Test backend
  try {
    const response = await axios.get("http://localhost:3000/api/users");
    console.log("✅ Backend is running and accessible");
  } catch (error) {
    console.log("❌ Backend connection failed:", error.message);
    console.log(
      "   Make sure backend is running: cd ../backend && npm run dev"
    );
    return false;
  }

  // Test TMDB API
  try {
    const response = await axios.get(
      "https://api.themoviedb.org/3/movie/popular?page=1",
      {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhZGMxZWUyZGNhN2FmNTg5OWUyYWE2MTNkZDE0YTZjNCIsIm5iZiI6MTc1MDcxNDQ3Mi40NDUsInN1YiI6IjY4NTljODY4MjUxMTMwOGY5YTlhMjdlNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.gUx5_Ow1JI-Ex7Onnqp4sFYFuyTO8hu-k91xvYAGDjc",
        },
      }
    );
    console.log("✅ TMDB API is accessible");
    console.log(
      `   Found ${response.data.results.length} movies on first page`
    );
    console.log(`   Sample movie: "${response.data.results[0].title}"`);
  } catch (error) {
    console.log("❌ TMDB API connection failed:", error.message);
    return false;
  }

  console.log("\n🎉 All connections successful! Ready to run the seeder.");
  return true;
}

testConnections();
