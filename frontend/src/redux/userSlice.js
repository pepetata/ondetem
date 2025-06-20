import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createUser, updateUser, fetchCurrentUser } from "../api/usersApi";
import { showNotification } from "../components/helper";

const getToken = (getState) => {
  const state = getState();
  return (
    state.auth?.token ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken")
  );
};

export const createUserThunk = createAsyncThunk(
  "user/create",
  async (formData, { dispatch, rejectWithValue }) => {
    console.log(`Creating user with formData:`, Array.from(formData.entries()));
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
      console.log(`userSlice err=`, err);
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
  async ({ userId, formData }, { dispatch, rejectWithValue, getState }) => {
    try {
      // Get token from auth state or storage
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");

      console.log(
        `Updating user ${userId} with formData:`,
        Array.from(formData.entries())
      );
      const result = await updateUser(userId, formData);
      dispatch(
        showNotification({
          type: "success",
          message: "Usuário atualizado com sucesso!",
        })
      );
      return result;
    } catch (err) {
      console.log(`userSlice updateUser err=`, err);
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

export const fetchUserThunk = createAsyncThunk(
  "user/fetch",
  async (_, { dispatch, rejectWithValue, getState }) => {
    try {
      // Get token from auth state or storage
      const state = getState();
      const token =
        state.auth?.token ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      if (!token) throw new Error("Usuário não autenticado");

      const user = await fetchCurrentUser(token);
      return user;
    } catch (err) {
      console.log(`userSlice fetchUser err=`, err);
      dispatch(
        showNotification({
          type: "error",
          message:
            err.response?.data?.error ||
            err.message ||
            "Erro ao buscar usuário",
        })
      );
      return rejectWithValue(
        err.response?.data?.error || err.message || "Erro ao buscar usuário"
      );
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    error: null,
    // userId: null,
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
        // state.userId = action.payload.userId;
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // state.user = action.payload;
      })
      .addCase(fetchUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
