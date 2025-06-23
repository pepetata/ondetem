import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createAd,
  updateAd,
  deleteAd,
  getAd,
  getAllAds,
  getUserAds,
  getToken,
} from "../api/adAPI";
import { showNotification } from "../components/helper";

function handleThunkError(dispatch, err, rejectWithValue) {
  const message = err.response?.data?.error || err.message;
  dispatch(showNotification({ type: "error", message }));
  return rejectWithValue(message);
}

export const createAdThunk = createAsyncThunk(
  "ads/create",
  async (formData, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");
      const ad = await createAd(formData, token);
      dispatch(
        showNotification({
          type: "success",
          message: "Anúncio criado com sucesso!",
        })
      );
      return ad;
    } catch (err) {
      return handleThunkError(dispatch, err, rejectWithValue);
    }
  }
);

export const updateAdThunk = createAsyncThunk(
  "ads/update",
  async ({ adId, formData }, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");
      const ad = await updateAd(adId, formData, token);
      dispatch(
        showNotification({ type: "success", message: "Anúncio atualizado!" })
      );
      return ad;
    } catch (err) {
      dispatch(
        showNotification({
          type: "error",
          message: "ID do anúncio não encontrado.",
        })
      );
      return handleThunkError(dispatch, err, rejectWithValue);
    }
  }
);

export const deleteAdThunk = createAsyncThunk(
  "ads/delete",
  async (adId, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");
      await deleteAd(adId, token);
      dispatch(
        showNotification({ type: "success", message: "Anúncio removido!" })
      );
      return adId;
    } catch (err) {
      dispatch(
        showNotification({
          type: "error",
          message: "Anúncio não encontrado.",
        })
      );
      return handleThunkError(dispatch, err, rejectWithValue);
    }
  }
);

export const getAdThunk = createAsyncThunk(
  "ads/getOne",
  async (adId, { rejectWithValue }) => {
    try {
      return await getAd(adId);
    } catch (err) {
      return handleThunkError(dispatch, err, rejectWithValue);
    }
  }
);

export const getAllAdsThunk = createAsyncThunk(
  "ads/getAll",
  async (_, { rejectWithValue }) => {
    try {
      return await getAllAds();
    } catch (err) {
      return handleThunkError(dispatch, err, rejectWithValue);
    }
  }
);

export const getUserAdsThunk = createAsyncThunk(
  "ads/getUserAds",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getToken(getState);
      if (!token) throw new Error("Usuário não autenticado");
      return await getUserAds(token);
    } catch (err) {
      return handleThunkError(dispatch, err, rejectWithValue);
    }
  }
);

const adSlice = createSlice({
  name: "ads",
  initialState: {
    ads: [],
    userAds: [],
    currentAd: null,
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentAd(state, action) {
      console.log(`Setting current ad:`, action.payload);
      state.currentAd = action.payload;
    },
    clearCurrentAd(state) {
      state.currentAd = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAdThunk.fulfilled, (state, action) => {
        state.currentAd = action.payload; // <-- add this
        state.ads.push(action.payload);
      })
      .addCase(updateAdThunk.fulfilled, (state, action) => {
        const idx = state.ads.findIndex((ad) => ad.id === action.payload.id);
        if (idx !== -1) state.ads[idx] = action.payload;
      })
      .addCase(deleteAdThunk.fulfilled, (state, action) => {
        state.ads = state.ads.filter((ad) => ad.id !== action.payload);
      })
      .addCase(getAdThunk.fulfilled, (state, action) => {
        state.currentAd = action.payload;
      })
      .addCase(getAllAdsThunk.fulfilled, (state, action) => {
        state.ads = action.payload;
      })
      .addCase(getUserAdsThunk.fulfilled, (state, action) => {
        state.userAds = action.payload;
      });
  },
});

export default adSlice.reducer;
export const { setCurrentAd, clearCurrentAd } = adSlice.actions;
