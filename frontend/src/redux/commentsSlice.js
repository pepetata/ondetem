import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import { commentsAPI } from "../api/commentsAPI";

// Async thunks
export const fetchCommentsByAdId = createAsyncThunk(
  "comments/fetchByAdId",
  async (adId, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getCommentsByAdId(adId);
      return { adId, comments: response.comments };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCommentsCount = createAsyncThunk(
  "comments/fetchCount",
  async (adId, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getCommentsCount(adId);
      return { adId, count: response.count };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createComment = createAsyncThunk(
  "comments/create",
  async ({ adId, content }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.createComment(adId, content);
      return { adId, comment: response.comment };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateComment = createAsyncThunk(
  "comments/update",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.updateComment(commentId, content);
      return response.comment;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteComment = createAsyncThunk(
  "comments/delete",
  async (commentId, { rejectWithValue }) => {
    try {
      await commentsAPI.deleteComment(commentId);
      return commentId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserComments = createAsyncThunk(
  "comments/fetchUserComments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await commentsAPI.getUserComments();
      return response.comments;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const commentsSlice = createSlice({
  name: "comments",
  initialState: {
    commentsByAd: {}, // { adId: [comments] }
    countsByAd: {}, // { adId: count }
    userComments: [],
    loading: false,
    error: null,
    submitting: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearComments: (state) => {
      state.commentsByAd = {};
      state.countsByAd = {};
      state.userComments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments by ad ID
      .addCase(fetchCommentsByAdId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentsByAdId.fulfilled, (state, action) => {
        state.loading = false;
        const { adId, comments } = action.payload;
        state.commentsByAd[adId] = comments;
        state.countsByAd[adId] = comments.length;
      })
      .addCase(fetchCommentsByAdId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch comments count
      .addCase(fetchCommentsCount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentsCount.fulfilled, (state, action) => {
        state.loading = false;
        const { adId, count } = action.payload;
        state.countsByAd[adId] = count;
      })
      .addCase(fetchCommentsCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create comment
      .addCase(createComment.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.submitting = false;
        const { adId, comment } = action.payload;

        // Add comment to the ad's comments array
        if (state.commentsByAd[adId]) {
          state.commentsByAd[adId].unshift(comment); // Add to beginning (newest first)
        } else {
          state.commentsByAd[adId] = [comment];
        }

        // Update count
        state.countsByAd[adId] = (state.countsByAd[adId] || 0) + 1;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.submitting = false;
        const updatedComment = action.payload;

        // Update comment in all relevant places
        Object.keys(state.commentsByAd).forEach((adId) => {
          const commentIndex = state.commentsByAd[adId].findIndex(
            (comment) => comment.id === updatedComment.id
          );
          if (commentIndex !== -1) {
            state.commentsByAd[adId][commentIndex] = updatedComment;
          }
        });

        // Update in user comments
        const userCommentIndex = state.userComments.findIndex(
          (comment) => comment.id === updatedComment.id
        );
        if (userCommentIndex !== -1) {
          state.userComments[userCommentIndex] = updatedComment;
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.submitting = false;
        const commentId = action.payload;

        // Remove comment from all ad comments
        Object.keys(state.commentsByAd).forEach((adId) => {
          const commentIndex = state.commentsByAd[adId].findIndex(
            (comment) => comment.id === commentId
          );
          if (commentIndex !== -1) {
            state.commentsByAd[adId].splice(commentIndex, 1);
            state.countsByAd[adId] = Math.max(
              0,
              (state.countsByAd[adId] || 1) - 1
            );
          }
        });

        // Remove from user comments
        state.userComments = state.userComments.filter(
          (comment) => comment.id !== commentId
        );
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Fetch user comments
      .addCase(fetchUserComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserComments.fulfilled, (state, action) => {
        state.loading = false;
        state.userComments = action.payload;
      })
      .addCase(fetchUserComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearComments } = commentsSlice.actions;

// Base selectors
const selectCommentsState = (state) => state.comments;
const selectCommentsByAd = (state) => state.comments.commentsByAd;
const selectCountsByAd = (state) => state.comments.countsByAd;

// Memoized selectors
export const selectCommentsByAdId = createSelector(
  [selectCommentsByAd, (state, adId) => adId],
  (commentsByAd, adId) => commentsByAd[adId] || []
);

export const selectCommentsCount = createSelector(
  [selectCountsByAd, (state, adId) => adId],
  (countsByAd, adId) => countsByAd[adId] || 0
);

export const selectUserComments = (state) => state.comments.userComments;
export const selectCommentsLoading = (state) => state.comments.loading;
export const selectCommentsSubmitting = (state) => state.comments.submitting;
export const selectCommentsError = (state) => state.comments.error;

export default commentsSlice.reducer;
