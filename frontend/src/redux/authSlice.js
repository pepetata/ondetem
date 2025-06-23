import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login as loginAPI } from "../api/authAPI";
import { showNotification } from "../components/helper";

// Helper to load from storage
function loadAuthFromStorage() {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const userStr =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }
  return { token, user };
}

const initialState = {
  ...loadAuthFromStorage(),
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const data = await loginAPI(email, password);
      return data;
    } catch (err) {
      console.log(`loginThunk err=`, err);
      dispatch(
        showNotification({
          type: "error",
          message: err.response?.data?.error || "Erro durante login!",
        })
      );
      return rejectWithValue(err.response?.data?.error || "Erro ao logar");
    }
  }
);

// export const fetchProfileThunk = createAsyncThunk(
//   "auth/fetchProfile",
//   async (_, { getState, rejectWithValue }) => {
//     try {
//       const state = getState();
//       const token =
//         state.auth?.token ||
//         localStorage.getItem("authToken") ||
//         sessionStorage.getItem("authToken");
//       if (!token) throw new Error("Usuário não autenticado");
//       const user = await fetchCurrentUser(token);
//       return user;
//     } catch (err) {
//       return rejectWithValue(
//         err.response?.data?.error || err.message || "Erro ao buscar usuário"
//       );
//     }
//   }
// );

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
    },
    setUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
