import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import loanSellerService from '../../services/loanSeller';
import { toast } from 'react-toastify';

const initialState = {
  loading: false,
  loans: [],
  repayments: [],
  error: '',
  params: {
    page: 1,
    perPage: 10,
  },
  meta: {},
};

export const fetchSellerLoans = createAsyncThunk(
  'sellerLoans/fetchLoans',
  async (params = {}) => loanSellerService.getAll(params)
);

export const fetchSellerRepayments = createAsyncThunk(
  'sellerLoans/fetchRepayments',
  async (params = {}) => loanSellerService.getRepayments(params)
);

export const createSellerRepayment = createAsyncThunk(
  'sellerLoans/createRepayment',
  async (data) => {
    const response = await loanSellerService.createRepayment(data);
    toast.success('Repayment recorded successfully');
    return response.data;
  }
);

const sellerLoansSlice = createSlice({
  name: 'sellerLoans',
  initialState,
  reducers: {
    setParams: (state, action) => {
      state.params = { ...state.params, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerLoans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSellerLoans.fulfilled, (state, action) => {
        const { data, meta } = action.payload;
        state.loading = false;
        state.loans = data;
        state.meta = meta;
        state.error = '';
      })
      .addCase(fetchSellerLoans.rejected, (state, action) => {
        state.loading = false;
        state.loans = [];
        state.error = action.error.message;
      })
      .addCase(fetchSellerRepayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSellerRepayments.fulfilled, (state, action) => {
        const { data, meta } = action.payload;
        state.loading = false;
        state.repayments = data;
        state.meta = meta;
        state.error = '';
      })
      .addCase(fetchSellerRepayments.rejected, (state, action) => {
        state.loading = false;
        state.repayments = [];
        state.error = action.error.message;
      })
      .addCase(createSellerRepayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSellerRepayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createSellerRepayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setParams } = sellerLoansSlice.actions;
export default sellerLoansSlice.reducer; 