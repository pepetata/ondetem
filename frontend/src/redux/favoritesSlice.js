import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as favoritesAPI from "../api/favoritesAPI";
import { showNotification } from "../components/helper";

const initialState = {
  favorites: [],
  favoriteIds: [],
  loading: false,
  error: null,
};

export const fetchUserFavorites = createAsyncThunk(
  "favorites/fetchUserFavorites",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const favorites = await favoritesAPI.getUserFavorites();
      return favorites;
    } catch (error) {
      const message = error.response?.data?.error || "Erro ao buscar favoritos";
      dispatch(showNotification({ type: "error", message }));
      return rejectWithValue(message);
    }
  }
);

export const fetchFavoriteIds = createAsyncThunk(
  "favorites/fetchFavoriteIds",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const favoriteIds = await favoritesAPI.getFavoriteIds();
      return favoriteIds;
    } catch (error) {
      // Don't show notification for this as it's used quietly in background
      return rejectWithValue(
        error.response?.data?.error || "Erro ao buscar favoritos"
      );
    }
  }
);

export const addToFavorites = createAsyncThunk(
  "favorites/addToFavorites",
  async (adId, { dispatch, rejectWithValue }) => {
    try {
      const result = await favoritesAPI.addToFavorites(adId);
      dispatch(
        showNotification({
          type: "success",
          message: "Anúncio adicionado aos favoritos!",
        })
      );
      return { adId, message: result.message };
    } catch (error) {
      const message =
        error.response?.data?.error || "Erro ao adicionar aos favoritos";
      dispatch(showNotification({ type: "error", message }));
      return rejectWithValue(message);
    }
  }
);

export const removeFromFavorites = createAsyncThunk(
  "favorites/removeFromFavorites",
  async (adId, { dispatch, rejectWithValue }) => {
    try {
      const result = await favoritesAPI.removeFromFavorites(adId);
      dispatch(
        showNotification({
          type: "success",
          message: "Anúncio removido dos favoritos!",
        })
      );
      return { adId, message: result.message };
    } catch (error) {
      const message =
        error.response?.data?.error || "Erro ao remover dos favoritos";
      dispatch(showNotification({ type: "error", message }));
      return rejectWithValue(message);
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.favorites = [];
      state.favoriteIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user favorites
      .addCase(fetchUserFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.favoriteIds = action.payload.map((fav) => fav.id);
      })
      .addCase(fetchUserFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch favorite IDs
      .addCase(fetchFavoriteIds.fulfilled, (state, action) => {
        state.favoriteIds = action.payload;
      })

      // Add to favorites
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const { adId } = action.payload;
        if (!state.favoriteIds.includes(adId)) {
          state.favoriteIds.push(adId);
        }
      })

      // Remove from favorites
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const { adId } = action.payload;
        state.favoriteIds = state.favoriteIds.filter((id) => id !== adId);
        state.favorites = state.favorites.filter((fav) => fav.id !== adId);
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
