import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createUser } from "../api/usersApi";

export const createUserThunk = createAsyncThunk(
  "user/register",
  async (formData, { rejectWithValue }) => {
    try {
      return await createUser(formData);
    } catch (err) {
      console.error("Error creating user:", error); // This should run on error
      return rejectWithValue(
        err.response?.data?.error || "Error creating user failed"
      );
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    error: null,
    userId: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.userId = action.payload.userId;
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
