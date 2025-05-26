import React, { useState } from 'react';
import { Button, Col, DatePicker, Form, InputNumber, Row, Switch } from 'antd';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';
import productService from 'services/seller/product';
import { InfiniteSelect } from 'components/infinite-select';

export default function ProductBonusForm({ form, handleSubmit }) {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  //states
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [hasMore, setHasMore] = useState({
    product: false,
    bonusProduct: false,
  });

  //functions
  function fetchProductsStock({ page = 1, search }) {
    const params = {
      page,
      search: search?.length ? search : undefined,
    };
    return productService.getStock(params).then((res) => {
      setHasMore({
        ...hasMore,
        product: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res.data.map((stock) => ({
        label: `${stock?.product?.translation?.title} ${
          stock?.extras?.length
            ? `=> ${stock?.extras
                ?.map(
                  (extra) =>
                    `${extra?.group?.translation?.title}: ${extra?.value}`,
                )
                ?.join(', ')}`
            : ''
        }`,
        value: stock?.id,
        key: stock?.id,
      }));
    });
  }
  function fetchBonusProductsStock({ page = 1, search }) {
    const params = {
      page,
      search: search?.length ? search : undefined,
    };
    return productService.getStock(params).then((res) => {
      setHasMore({
        ...hasMore,
        bonusProduct: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res.data.map((stock) => ({
        label: `${stock?.product?.translation?.title} ${
          stock?.extras?.length
            ? `=> ${stock?.extras
                ?.map(
                  (extra) =>
                    `${extra?.group?.translation?.title}: ${extra?.value}`,
                )
                ?.join(', ')}`
            : ''
        }`,
        value: stock?.id,
        key: stock?.id,
      }));
    });
  }

  //helpers
  const getInitialTimes = () => {
    if (!activeMenu.data?.expired_at) {
      return {};
    }
    const data = JSON.parse(activeMenu.data?.expired_at);
    return {
      expired_at: moment(data, 'HH:mm:ss'),
    };
  };

  //submit form
  const onFinish = (values) => {
    setLoadingBtn(true);
    handleSubmit(values).finally(() => setLoadingBtn(false));
  };

  return (
    <Form
      name='product-bonus-form'
      layout='vertical'
      onFinish={onFinish}
      form={form}
      initialValues={{
        status: true,
        ...activeMenu.data,
        ...getInitialTimes(),
      }}
      className='d-flex flex-column h-100'
    >
      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            label={t('products.stock')}
            name={'bonusable_id'}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <InfiniteSelect
              fetchOptions={fetchProductsStock}
              hasMore={hasMore.product}
              allowClear={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('product.quantity')}
            name={'value'}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <InputNumber className='w-100' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('bonus.product.stock')}
            name={'bonus_stock_id'}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <InfiniteSelect
              fetchOptions={fetchBonusProductsStock}
              hasMore={hasMore.bonusProduct}
              allowClear={false}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('bonus.product.quantity')}
            name={'bonus_quantity'}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <InputNumber className='w-100' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name='expired_at'
            label={t('expired.at')}
            rules={[{ required: true, message: t('required') }]}
          >
            <DatePicker
              className='w-100'
              placeholder=''
              disabledDate={(current) => moment().add(-1, 'days') >= current}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label={t('active')} name='status' valuePropName='checked'>
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <div className='flex-grow-1 d-flex flex-column justify-content-end'>
        <div className='pb-5'>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('submit')}
          </Button>
        </div>
      </div>
    </Form>
  );
}
