import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createUser, updateUser } from "../api/usersApi";
import { showNotification } from "../components/helper";
import e from "express";

export const createUserThunk = createAsyncThunk(
  "user/create",
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const result = await createUser(formData);
      dispatch(
        showNotification({
          type: "success",
          message: "Usuário criado com sucesso!",
        })
      );
      return result;
    } catch (err) {
      // console.log(`userSlice err=`, err);
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

export const updateUserThunk = createAsyncThunk(
  "user/update",
  async ({ userId, formData }, { dispatch, rejectWithValue }) => {
    try {
      const result = await updateUser(userId, formData);
      dispatch(
        showNotification({
          type: "success",
          message: "Usuário atualizado com sucesso!",
        })
      );
      return result;
    } catch (err) {
      dispatch(
        showNotification({
          type: "error",
          message: err.response?.data?.error || "Erro ao atualizar usuário",
        })
      );
      return rejectWithValue(
        err.response?.data?.error || "Erro ao atualizar usuário"
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
