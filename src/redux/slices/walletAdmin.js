import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import walletService from '../../services/wallet';

const initialState = {
  loading: false,
  histories: [],
  error: '',
  params: {
    page: 1,
    perPage: 10,
  },
  meta: {},
};

export const fetchWalletHistories = createAsyncThunk(
  'walletAdmin/fetchWalletHistories',
  async (params = {}) => {
    const response = await walletService.getAll(params);
    return response;
  }
);

const walletAdminSlice = createSlice({
  name: 'walletAdmin',
  initialState,
  reducers: {
    setParams: (state, action) => {
      state.params = { ...state.params, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletHistories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWalletHistories.fulfilled, (state, action) => {
        const { data, meta } = action.payload;
        state.loading = false;
        state.histories = data;
        state.meta = meta;
        state.params.page = meta.current_page;
        state.params.perPage = meta.per_page;
        state.error = '';
      })
      .addCase(fetchWalletHistories.rejected, (state, action) => {
        state.loading = false;
        state.histories = [];
        state.error = action.error.message;
      });
  },
});

export const { setParams } = walletAdminSlice.actions;
export default walletAdminSlice.reducer; 