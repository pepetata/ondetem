import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { uploadAdImages, getAdImages, deleteAdImages } from "../api/adAPI";
import { getToken } from "../api/adAPI";

export const fetchAdImages = createAsyncThunk(
  "adImages/fetch",
  async (adId, { rejectWithValue }) => {
    try {
      return await getAdImages(adId);
    } catch (err) {
      console.error("uploadAdImage error:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const uploadAdImage = createAsyncThunk(
  "adImages/upload",
  async ({ adId, file }, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");
      return await uploadAdImages(adId, file, token);
    } catch (err) {
      console.error("uploadAdImage error:", err);
      return rejectWithValue(err.message);
    }
  }
);

export const deleteAdImage = createAsyncThunk(
  "adImages/delete",
  async ({ adId, filename }, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");
      await deleteAdImages(adId, filename, token);
      return filename;
    } catch (err) {
      console.error("uploadAdImage error:", err);
      return rejectWithValue(err.message);
    }
  }
);

const adImagesSlice = createSlice({
  name: "adImages",
  initialState: {
    images: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAdImages(state) {
      state.images = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdImages.fulfilled, (state, action) => {
        state.loading = false;
        state.images = action.payload;
      })
      .addCase(fetchAdImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadAdImage.fulfilled, (state, action) => {
        state.images.push(action.payload.filename);
      })
      .addCase(deleteAdImage.fulfilled, (state, action) => {
        state.images = state.images.filter((img) => img !== action.payload);
      });
  },
});

export const { clearAdImages } = adImagesSlice.actions;
export default adImagesSlice.reducer;
