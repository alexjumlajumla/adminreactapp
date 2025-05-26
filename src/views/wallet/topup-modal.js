import React, { useState } from 'react';
import { Modal, Form, InputNumber, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import userService from '../../services/user';
import { DebounceSelect } from '../../components/search';
import { toast } from 'react-toastify';

export default function WalletTopUpModal({ visible, onCancel, onSuccess }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function fetchUsers(search) {
    const params = { search, perPage: 10 };
    const res = await userService.search(params);
    return res.data.map((item) => ({ label: `${item.firstname} ${item.lastname}`, value: item.uuid }));
  }

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      const userUuid = typeof values.user_uuid === 'object' ? values.user_uuid.value : values.user_uuid;
      setLoading(true);
      try {
        await userService.topupWallet(userUuid, { price: values.amount });
        toast.success(t('success'));
        onSuccess && onSuccess();
        onCancel();
      } catch (error) {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Modal visible={visible} title={t('top_up_wallet')} onCancel={onCancel} footer={null} destroyOnClose>
      <Form form={form} layout='vertical'>
        <Form.Item
          name='user_uuid'
          label={t('user')}
          rules={[{ required: true, message: t('required') }]}
        >
          <DebounceSelect fetchOptions={fetchUsers} placeholder={t('select.user')} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name='amount'
          label={t('amount')}
          rules={[{ required: true, message: t('required') }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item>
          <Button type='primary' loading={loading} onClick={handleSubmit} block>
            {t('submit')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
} 