import { Button, Col, Divider, Form, Row, Space } from 'antd';
import categoryService from 'services/rest/category';
import kitchenService from 'services/seller/kitchen';
import { useTranslation } from 'react-i18next';
import { AsyncTreeSelect } from 'components/async-tree-select-category';
import React, { useState } from 'react';
import { InfiniteSelect } from 'components/infinite-select';
import productService from 'services/seller/product';
import { shallowEqual, useSelector } from 'react-redux';

const UpdateKitchens = ({ handleClose, refetchProductList }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const { myShop } = useSelector((state) => state.myShop, shallowEqual);

  const [hasMore, setHasMore] = useState({ kitchen: false });
  const [loadingBtn, setLoadingBtn] = useState(false);

  const fetchCategories = (search) => {
    const params = {
      perPage: 20,
      type: 'main',
      search: search?.length ? search : undefined,
      'statuses[0]': 'pending',
      'statuses[1]': 'published',
      active: 1,
      shop_id: myShop?.id,
    };
    return categoryService.paginateSelect(params).then((res) => {
      return res.data.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
        disabled: !!item?.children?.length,
        children: item?.children?.map((child) => ({
          label: child?.translation?.title || t('N/A'),
          value: child?.id,
          key: child?.id,
        })),
      }));
    });
  };

  const fetchKitchens = ({ page = 1, search = '' }) => {
    const params = {
      search: search?.length ? search : undefined,
      page: 1,
      active: 1,
    };
    return kitchenService.getAll(params).then((res) => {
      setHasMore({
        ...hasMore,
        kitchen: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res?.data?.map((item) => ({
        label: item?.translation?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const onFinish = (values) => {
    const body = {
      category_ids: values?.categories?.map((item) => item?.value),
      kitchen_id: values?.kitchen?.value,
    };
    setLoadingBtn(true);
    productService
      .updateKitchens(body)
      .then(() => {
        refetchProductList();
        handleClose();
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  return (
    <Form form={form} layout='vertical' onFinish={onFinish}>
      <Row gutter={12}>
        <Col span={24}>
          <Form.Item
            label={t('categories')}
            name='categories'
            rules={[{ required: true, message: t('required') }]}
          >
            <AsyncTreeSelect
              multiple={true}
              refetch
              fetchOptions={fetchCategories}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item
            label={t('kitchen')}
            name='kitchen'
            rules={[{ required: true }]}
          >
            <InfiniteSelect
              fetchOptions={fetchKitchens}
              allowClear={false}
              hasMore={hasMore.kitchen}
            />
          </Form.Item>
        </Col>
      </Row>
      <Divider />
      <Space>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button htmlType='submit' type='primary' loading={loadingBtn}>
          {t('submit')}
        </Button>
      </Space>
    </Form>
  );
};

export default UpdateKitchens;
