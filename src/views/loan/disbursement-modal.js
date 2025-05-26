import React, { useState } from 'react';
import { Modal, Form, InputNumber, DatePicker, Button, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { DebounceSelect } from '../../components/search';
import userService from '../../services/user';
import loanService from '../../services/loan';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

export default function LoanDisbursementModal({ visible, onCancel, onSuccess }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function fetchSellers(search) {
    const params = { search, perPage: 10, role: 'seller' };
    const res = await userService.search(params);
    return res.data.map((item) => ({ label: `${item.firstname} ${item.lastname}`, value: item.id }));
  }

  const submit = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        const payload = {
          user_id: values.user_id.value,
          amount: values.amount,
          interest_rate: values.interest_rate,
          due_date: values.due_date.format('YYYY-MM-DD'),
          note: values.note,
        };
        await loanService.create(payload);
        toast.success(t('success'));
        onSuccess && onSuccess();
        onCancel();
      } catch (e) {
        // error handled globally
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal visible={visible} title={t('disburse_loan')} onCancel={onCancel} onOk={submit} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout='vertical' initialValues={{ interest_rate: 0, due_date: dayjs().add(30, 'day') }}>
        <Form.Item name='user_id' label={t('seller')} rules={[{ required: true, message: t('required') }]}> 
          <DebounceSelect fetchOptions={fetchSellers} placeholder={t('select.seller')} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='amount' label={t('amount')} rules={[{ required: true, message: t('required') }]}> 
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='interest_rate' label={t('interest_rate_%')} rules={[{ required: true, message: t('required') }]}> 
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='due_date' label={t('due_date')} rules={[{ required: true, message: t('required') }]}> 
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name='note' label={t('note')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
} 