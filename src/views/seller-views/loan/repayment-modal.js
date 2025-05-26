import React, { useState } from 'react';
import { Modal, Form, InputNumber, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DebounceSelect } from '../../../components/search';
import { createSellerRepayment } from '../../../redux/slices/sellerLoans';
import { useDispatch } from 'react-redux';

export default function RepaymentModal({ visible, onCancel, onSuccess }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loans } = useSelector((state) => state.sellerLoans);
  const [loading, setLoading] = useState(false);

  const fetchActiveLoans = async (search = '') => {
    return loans
      .filter((l) => l.status === 'active' && `${l.id}`.includes(search))
      .map((l) => ({ label: `#${l.id} - ${t('balance')}: ${l.remaining_amount}`, value: l.id }));
  };

  const submit = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const payload = {
          ...values,
          loan_id: values.loan_id?.value ?? values.loan_id,
        };
        await dispatch(createSellerRepayment(payload)).unwrap();
        onSuccess && onSuccess();
        onCancel();
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal visible={visible} title={t('repay_loan')} onCancel={onCancel} onOk={submit} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout='vertical'>
        <Form.Item name='loan_id' label={t('loan')} rules={[{ required: true, message: t('required') }]}> 
          <DebounceSelect fetchOptions={fetchActiveLoans} placeholder={t('select.loan')} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='amount' label={t('amount')} rules={[{ required: true, message: t('required') }]}> 
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='payment_method' label={t('payment_method')} initialValue='wallet' rules={[{ required: true, message: t('required') }]}> 
          <Select options={[{ value: 'wallet', label: t('wallet') }]} disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
} 