import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vfdService from '../../services/vfd';
import { toast } from 'react-toastify';

const initialState = {
  loading: false,
  receipts: [],
  error: '',
  params: {
    page: 1,
    perPage: 10,
  },
  meta: {},
};

export const fetchVfdReceipts = createAsyncThunk(
  'vfd/fetchReceipts',
  async (params = {}) => {
    const response = await vfdService.getAll(params);
    return response.data;
  }
);

export const generateVfdReceipt = createAsyncThunk(
  'vfd/generateReceipt',
  async (data) => {
    const response = await vfdService.generate(data);
    toast.success('Receipt generated successfully');
    return response.data;
  }
);

const vfdSlice = createSlice({
  name: 'vfd',
  initialState,
  reducers: {
    setParams: (state, action) => {
      state.params = { ...state.params, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVfdReceipts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVfdReceipts.fulfilled, (state, action) => {
        const { data, meta } = action.payload;
        state.loading = false;
        state.receipts = data;
        state.meta = meta;
        state.error = '';
      })
      .addCase(fetchVfdReceipts.rejected, (state, action) => {
        state.loading = false;
        state.receipts = [];
        state.error = action.error.message;
      })
      .addCase(generateVfdReceipt.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateVfdReceipt.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateVfdReceipt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setParams } = vfdSlice.actions;
export default vfdSlice.reducer; 