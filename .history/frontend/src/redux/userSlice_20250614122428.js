import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createUser } from "../api/usersApi";
import { showNotification } from "../components/helper"; // <-- import this

export const createUserThunk = createAsyncThunk(
  "user/register",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      return await createUser(formData);
    } catch (err) {
      dispatch(
        showNotification({
          type: "error",
          message: err.response?.data?.error || "Erro ao criar usuário",
        })
      );
      return rejectWithValue(
        err.response?.data?.error || "Erro ao criar usuário"
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
