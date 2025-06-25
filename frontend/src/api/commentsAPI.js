import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
  // Check both localStorage and sessionStorage for authToken
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Comments API functions
export const commentsAPI = {
  // Get all comments for an ad (public)
  getCommentsByAdId: async (adId) => {
    try {
      const response = await api.get(`/comments/ad/${adId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  },

  // Get comments count for an ad (public)
  getCommentsCount: async (adId) => {
    try {
      const response = await api.get(`/comments/ad/${adId}/count`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch comments count"
      );
    }
  },

  // Create a new comment (requires authentication)
  createComment: async (adId, content) => {
    try {
      const response = await api.post("/comments", {
        ad_id: adId,
        content,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create comment"
      );
    }
  },

  // Update a comment (requires authentication and ownership)
  updateComment: async (commentId, content) => {
    try {
      const response = await api.put(`/comments/${commentId}`, {
        content,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update comment"
      );
    }
  },

  // Delete a comment (requires authentication and ownership)
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete comment"
      );
    }
  },

  // Get all comments by the authenticated user
  getUserComments: async () => {
    try {
      const response = await api.get("/comments/user");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch user comments"
      );
    }
  },
};

export default commentsAPI;
