import React, { useState } from 'react';
import { Button, Form, Input, Modal, Select } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { generateVfdReceipt } from '../../redux/slices/vfd';
import { setRefetch } from '../../redux/slices/menu';

const { Option } = Select;

export default function VfdReceiptModal({ visible, handleCancel }) {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.vfd, shallowEqual);

  const onFinish = (values) => {
    dispatch(generateVfdReceipt(values)).then(() => {
      handleCancel();
      dispatch(setRefetch(true));
    });
  };

  return (
    <Modal
      visible={visible}
      title={t('generate_vfd_receipt')}
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
          {t('generate')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          receipt_type: 'delivery',
        }}
      >
        <Form.Item
          label={t('receipt_type')}
          name="receipt_type"
          rules={[{ required: true, message: t('required') }]}
        >
          <Select>
            <Option value="delivery">{t('delivery')}</Option>
            <Option value="subscription">{t('subscription')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label={t('amount')}
          name="amount"
          rules={[{ required: true, message: t('required') }]}
        >
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item
          label={t('customer_name')}
          name="customer_name"
          rules={[{ required: true, message: t('required') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('customer_phone')}
          name="customer_phone"
          rules={[{ required: true, message: t('required') }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label={t('customer_address')}
          name="customer_address"
          rules={[{ required: true, message: t('required') }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
} 