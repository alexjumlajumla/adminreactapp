import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import MediaUpload from 'components/upload';
import useDemo from 'helpers/useDemo';
import moment from 'moment/moment';
import { shallowEqual, useSelector } from 'react-redux';
import userService from 'services/seller/user';
import { toast } from 'react-toastify';
import { DebounceSelect } from 'components/search';
import kitchenService from 'services/seller/kitchen';
import bookingTableService from 'services/seller/booking-table';

const UserEditDetails = ({ data }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const { isDemo } = useDemo();

  const { myShop } = useSelector((state) => state.myShop, shallowEqual);

  const [avatar, setAvatar] = useState(data?.avatar || []);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const initialValues = {
    ...data,
    kitchen: data?.kitchen
      ? {
          label: data?.kitchen?.translation?.title,
          value: data?.kitchen?.id,
          key: data?.kitchen?.id,
        }
      : null,
    table: data?.table
      ? {
          label: data?.table?.name,
          value: data?.table?.id,
          key: data?.table?.id,
        }
      : null,
    isWork: !!data?.isWork,
  };

  const fetchKitchen = (search = '') => {
    const params = {
      search: search?.length ? search : undefined,
      page: 1,
      perPage: 20,
      active: 1,
    };
    return kitchenService.getAll(params).then((res) =>
      res?.data?.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const fetchBookingTables = (search = '') => {
    const params = {
      search: search?.length ? search : undefined,
      page: 1,
      perPage: 20,
      active: 1,
    };
    return bookingTableService.getAll(params).then((res) =>
      res?.data?.map((item) => ({
        label: item?.name,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  const onFinish = (values) => {
    const body = {
      images: avatar?.[0] ? [avatar?.[0]?.name] : undefined,
      firstname: values?.firstname,
      lastname: values?.lastname,
      email: isDemo ? undefined : values?.email,
      phone: isDemo ? undefined : values?.phone,
      birthday: values?.birthday
        ? moment(values?.birthday).format('YYYY-MM-DD')
        : undefined,
      gender: values?.gender?.value,
      role: data?.role,
      shop_id: [myShop?.id],
      kitchen_id: data?.role === 'cook' ? values?.kitchen?.value : undefined,
      table_id: data?.role === 'deliveryman' ? values?.table?.value : undefined,
      isWork: data?.role === 'waiter' ? !!values?.isWork : undefined,
    };
    setLoadingBtn(true);
    userService
      .update(data?.uuid, body)
      .then(() => {
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  return (
    <Form
      form={form}
      layout='vertical'
      initialValues={initialValues}
      onFinish={onFinish}
    >
      <Row gutter={12}>
        <Col span={24}>
          <Form.Item
            name='avatar'
            label={t('avatar')}
            rules={[
              {
                required: !avatar?.length,
                message: t('required'),
              },
            ]}
          >
            <MediaUpload
              type={'restaurant/logo'}
              imageList={avatar}
              setImageList={setAvatar}
              form={form}
              multiple={false}
              name='avatar'
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name='firstname'
            label={t('firstname')}
            rules={[
              { required: true, message: t('required') },
              {
                type: 'string',
                min: 2,
                max: 200,
                message: t('min.2.max.200.chars'),
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name='lastname'
            label={t('lastname')}
            rules={[
              { required: true, message: t('required') },
              {
                type: 'string',
                min: 2,
                max: 200,
                message: t('min.2.max.200.chars'),
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('phone')}
            name='phone'
            rules={[{ required: !isDemo, message: t('required') }]}
          >
            <InputNumber min={0} className='w-100' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('birthday')}
            name='birthday'
            rules={[{ required: true, message: t('required') }]}
          >
            <DatePicker
              className='w-100'
              disabledDate={(current) => moment().add(-18, 'years') <= current}
              defaultPickerValue={moment().add(-18, 'years')}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('gender')}
            name='gender'
            rules={[{ required: true, message: t('required') }]}
          >
            <Select
              options={[
                { label: t('male'), value: 'male', key: 'male' },
                { label: t('female'), value: 'female', key: 'female' },
              ]}
              labelInValue
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('email')}
            name='email'
            rules={[
              { required: !isDemo, message: t('required') },
              { type: 'email', message: t('invalid.email') },
            ]}
          >
            <Input type='email' disabled={isDemo} />
          </Form.Item>
        </Col>
        {data?.role === 'cook' && (
          <Col span={12}>
            <Form.Item name='kitchen' label={t('kitchen')}>
              <DebounceSelect
                fetchOptions={fetchKitchen}
                placeholder={t('select.kitchen')}
              />
            </Form.Item>
          </Col>
        )}
        {data?.role === 'deliveryman' && (
          <Col span={12}>
            <Form.Item name='table' label={t('table')}>
              <DebounceSelect
                fetchOptions={fetchBookingTables}
                placeholder={t('select.table')}
              />
            </Form.Item>
          </Col>
        )}
        {data?.role === 'waiter' && (
          <Col>
            <Form.Item
              name='isWork'
              label={t('is.work')}
              valuePropName='checked'
            >
              <Switch />
            </Form.Item>
          </Col>
        )}
        <Col span={24}>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('save')}
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default UserEditDetails;
