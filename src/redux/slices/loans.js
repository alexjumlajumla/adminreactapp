import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import loanService from '../../services/loan';
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

export const fetchLoans = createAsyncThunk(
  'loans/fetchLoans',
  async (params = {}) => {
    const response = await loanService.getAll(params);
    return response.data;
  }
);

export const fetchRepayments = createAsyncThunk(
  'loans/fetchRepayments',
  async (params = {}) => {
    const response = await loanService.getRepayments(params);
    return response.data;
  }
);

export const createLoan = createAsyncThunk(
  'loans/createLoan',
  async (data) => {
    const response = await loanService.create(data);
    toast.success('Loan created successfully');
    return response.data;
  }
);

export const createRepayment = createAsyncThunk(
  'loans/createRepayment',
  async (data) => {
    const response = await loanService.createRepayment(data);
    toast.success('Repayment recorded successfully');
    return response.data;
  }
);

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setParams: (state, action) => {
      state.params = { ...state.params, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch loans
      .addCase(fetchLoans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        const { data, meta } = action.payload;
        state.loading = false;
        state.loans = data;
        state.meta = meta;
        state.error = '';
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.loading = false;
        state.loans = [];
        state.error = action.error.message;
      })
      // Fetch repayments
      .addCase(fetchRepayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        const { data, meta } = action.payload;
        state.loading = false;
        state.repayments = data;
        state.meta = meta;
        state.error = '';
      })
      .addCase(fetchRepayments.rejected, (state, action) => {
        state.loading = false;
        state.repayments = [];
        state.error = action.error.message;
      })
      // Create loan
      .addCase(createLoan.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLoan.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create repayment
      .addCase(createRepayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRepayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createRepayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setParams } = loansSlice.actions;
export default loansSlice.reducer; 