import React, { useState } from 'react';
import { Modal, Form, InputNumber, Button, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import loanService from '../../../services/loan';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { DebounceSelect } from '../../../components/search';

export default function RepaymentModal({ visible, onCancel, onSuccess }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { loans } = useSelector((state) => state.loans);

  // fetch active loans if needed
  async function fetchLoans(search) {
    // quick client side filter; alternatively call backend search
    return loans
      .filter((l) => l.status === 'active' && `${l.id}`.includes(search))
      .map((l) => ({ label: `#${l.id} - ${l.user?.firstname ?? ''}`, value: l.id }));
  }

  const submit = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        await loanService.createRepayment({ ...values });
        toast.success(t('success'));
        onSuccess && onSuccess();
        onCancel();
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal visible={visible} title={t('add_repayment')} onCancel={onCancel} onOk={submit} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout='vertical'>
        <Form.Item name='loan_id' label={t('loan')} rules={[{ required: true, message: t('required') }]}> 
          <DebounceSelect fetchOptions={fetchLoans} placeholder={t('select.loan')} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='amount' label={t('amount')} rules={[{ required: true, message: t('required') }]}> 
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='payment_method' label={t('payment_method')} rules={[{ required: true, message: t('required') }]}> 
          <Select options={[ { value:'wallet', label:t('wallet') }, { value:'cash', label:t('cash') }, { value:'card', label:'Card' } ]} />
        </Form.Item>
      </Form>
    </Modal>
  );
} 