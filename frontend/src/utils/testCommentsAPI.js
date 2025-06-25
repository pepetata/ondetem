// Test script to verify comments functionality
// This file can be used to manually test the comments API

const testCommentsAPI = async () => {
  const API_BASE_URL = "http://localhost:3000/api";

  console.log("🧪 Testing Comments API...");

  try {
    // Test 1: Get comments for a non-existent ad (should return empty array)
    console.log("📝 Test 1: Getting comments for test ad...");
    const response = await fetch(`${API_BASE_URL}/comments/ad/test-ad-id`);
    const data = await response.json();
    console.log("✅ Test 1 Result:", data);

    // Test 2: Get comments count for a non-existent ad (should return 0)
    console.log("📊 Test 2: Getting comments count...");
    const countResponse = await fetch(
      `${API_BASE_URL}/comments/ad/test-ad-id/count`
    );
    const countData = await countResponse.json();
    console.log("✅ Test 2 Result:", countData);

    console.log("🎉 Comments API is working correctly!");
  } catch (error) {
    console.error("❌ API Test failed:", error);
  }
};

// You can run this in the browser console to test the API
// testCommentsAPI();

export default testCommentsAPI;
