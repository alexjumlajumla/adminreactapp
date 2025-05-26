import React, { useState } from 'react';
import { Button, DatePicker, Form, Input, Modal, Select } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { createRepayment } from '../../redux/slices/loans';
import { setRefetch } from '../../redux/slices/menu';
import moment from 'moment';
import { AsyncSelect } from '../../components/async-select';
import loanService from '../../services/loan';

const { Option } = Select;

export default function RepaymentModal({ visible, handleCancel }) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.loans, shallowEqual);

  const onFinish = (values) => {
    const data = {
      ...values,
      paid_at: moment(values.paid_at).format('YYYY-MM-DD HH:mm:ss'),
    };
    dispatch(createRepayment(data)).then(() => {
      handleCancel();
      dispatch(setRefetch(true));
    });
  };

  const fetchLoanList = (search) => {
    return loanService.getAll({ search, status: 'active' }).then(({ data }) =>
      data.map((item) => ({
        label: `Loan #${item.id} - ${item.user?.firstname} ${item.user?.lastname} (${item.amount})`,
        value: item.id,
      }))
    );
  };

  return (
    <Modal
      visible={visible}
      title={t('add.repayment')}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t('cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          {t('save')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          paid_at: moment(),
          payment_method: 'wallet',
        }}
      >
        <Form.Item
          label={t('loan')}
          name="loan_id"
          rules={[{ required: true, message: t('required') }]}
        >
          <AsyncSelect
            fetchOptions={fetchLoanList}
            debounceTimeout={300}
          />
        </Form.Item>

        <Form.Item
          label={t('amount')}
          name="amount"
          rules={[{ required: true, message: t('required') }]}
        >
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item
          label={t('payment_method')}
          name="payment_method"
          rules={[{ required: true, message: t('required') }]}
        >
          <Select>
            <Option value="wallet">{t('wallet')}</Option>
            <Option value="mobile_money">{t('mobile_money')}</Option>
            <Option value="cash">{t('cash')}</Option>
            <Option value="card">{t('card')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('paid_at')}
          name="paid_at"
          rules={[{ required: true, message: t('required') }]}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
} 