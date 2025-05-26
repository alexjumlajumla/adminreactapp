import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, InputNumber, Row, Switch } from 'antd';
import { DebounceSelect } from 'components/search';
import shopService from 'services/restaurant';
import brandService from 'services/brand';
import categoryService from 'services/category';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import productService from 'services/product';
import { addMenu, replaceMenu, setMenuData } from 'redux/slices/menu';
import unitService from 'services/unit';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MediaUpload from 'components/upload';
import TextArea from 'antd/lib/input/TextArea';
import { RefetchSearch } from 'components/refetch-search';
import { PlusOutlined } from '@ant-design/icons';
import { AsyncTreeSelect } from 'components/async-tree-select-category';
import kitchenService from 'services/kitchen';
import { InfiniteSelect } from 'components/infinite-select';

const ProductsIndex = ({ next, action_type = '', isRequest }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const shop = Form.useWatch('shop', form);
  const dispatch = useDispatch();
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const [fileList, setFileList] = useState(
    activeMenu.data?.images ? activeMenu.data?.images : [],
  );
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [nutrition, setNutrition] = useState(Boolean(activeMenu.data?.kcal));
  const [hasMore, setHasMore] = useState({ kitchen: false });

  useEffect(() => {
    const data = form.getFieldsValue(true);
    dispatch(
      setMenuData({ activeMenu, data: { ...activeMenu.data, ...data } }),
    );
    // eslint-disable-next-line
  }, []);

  async function fetchUserShopList(search) {
    const params = {
      search: search?.length ? search : undefined,
      perPage: 20,
      page: 1,
      active: 1,
    };
    return shopService.get(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  }

  async function fetchUserBrandList(search) {
    const params = {
      page: 1,
      perPage: 20,
      type: 'main',
      search: search?.length ? search : undefined,
      active: 1,
    };
    return brandService.getAll(params).then((res) =>
      res.data.map((item) => ({
        label: item?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      })),
    );
  }

  async function fetchUserCategoryList(search) {
    const params = {
      page: 1,
      perPage: 20,
      type: 'main',
      search: search?.length ? search : undefined,
      shop_id: shop?.value,
      'statuses[0]': 'pending',
      'statuses[1]': 'published',
      active: 1,
    };
    return categoryService.selectPaginate(params).then((res) => {
      return res.data.map((item) => ({
        label: item?.translation?.title || t('N/A'),
        value: item?.id,
        key: item?.id,
        disabled: item?.children?.length > 0,
        children: item?.children?.map((child) => ({
          label: child?.translation?.title || t('N/A'),
          value: child?.id,
          key: child?.id,
        })),
      }));
    });
  }

  const fetchKitchens = ({ search, page = 1 }) => {
    const params = {
      search: search?.length ? search : undefined,
      page,
      perPage: 20,
      active: 1,
      shop_id: shop?.value,
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
    setLoadingBtn(true);
    const params = {
      ...values,
      active: Number(values.active),
      vegetarian: Number(values.vegetarian),
      brand_id: values.brand?.value,
      category_id: values.category?.value || values.category,
      shop_id: values.shop?.value,
      kitchen_id: values?.kitchen?.value || undefined,
      unit_id: values.unit?.value,
      kcal: nutrition ? String(values.kcal) : undefined,
      carbs: nutrition ? String(values.carbs) : undefined,
      protein: nutrition ? String(values.protein) : undefined,
      fats: nutrition ? String(values.fats) : undefined,
      images: undefined,
      brand: undefined,
      category: undefined,
      shop: undefined,
      unit: undefined,
      kitchen: undefined,
      tax: values.tax || 0,
      ...Object.assign(
        {},
        ...fileList.map((item, index) => ({
          [`images[${index}]`]: item.name,
        })),
      ),
    };

    if (isRequest) {
      dispatch(
        setMenuData({
          activeMenu,
          data: {
            ...activeMenu.data,
            ...params,
            images: fileList,
            brand: values.brand,
            category: values.category,
            kitchen: values?.kitchen || undefined,
            shop: values.shop,
            unit: values.unit,
            tax: values.tax || 0,
            title: {
              ...Object.assign(
                {},
                ...languages.map((lang) => ({
                  [lang.locale]: values[`title[${lang.locale}]`],
                })),
              ),
            },
            description: {
              ...Object.assign(
                {},
                ...languages.map((lang) => ({
                  [lang.locale]: values[`description[${lang.locale}]`],
                })),
              ),
            },
          },
        }),
      );
      next();
      return;
    }

    if (action_type === 'edit') {
      productUpdate(values, params);
    } else {
      productCreate(values, params);
    }
  };

  function productCreate(values, params) {
    productService
      .create(params)
      .then(({ data }) => {
        dispatch(
          replaceMenu({
            id: `product-${data.uuid}`,
            url: `product/${data.uuid}`,
            name: t('add.product'),
            data: values,
            refetch: false,
          }),
        );
        navigate(`/product/${data.uuid}/?step=1`);
      })
      .catch((err) => setError(err.response.data.params))
      .finally(() => setLoadingBtn(false));
  }

  function productUpdate(values, params) {
    productService
      .update(uuid, params)
      .then(() => {
        dispatch(
          setMenuData({
            activeMenu,
            data: { ...values, ...activeMenu?.data },
          }),
        );
        next();
      })
      .catch((err) => setError(err.response.data.params))
      .finally(() => setLoadingBtn(false));
  }

  function fetchUnits(search) {
    const params = {
      perPage: 20,
      page: 1,
      active: 1,
      search: search?.length ? search : undefined,
    };
    return unitService.getAll(params).then(({ data }) => {
      return data?.map((item) => ({
        label: item?.translation?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  }

  const goToAddCategory = () => {
    dispatch(
      addMenu({
        id: 'category-add',
        url: 'category/add',
        name: t('add.category'),
      }),
    );
    navigate('/category/add');
  };

  return (
    <Form
      layout='vertical'
      form={form}
      initialValues={{ active: true, vegetarian: true, ...activeMenu.data }}
      onFinish={onFinish}
    >
      <Row gutter={12}>
        <Col span={16}>
          <Row>
            <Col span={24}>
              <Card title={t('basic.info')}>
                <Row>
                  <Col span={24}>
                    {languages.map((item) => (
                      <Form.Item
                        key={'name' + item.id}
                        label={t('name')}
                        name={`title[${item.locale}]`}
                        rules={[
                          {
                            required: item?.locale === defaultLang,
                            message: t('required'),
                          },
                          {
                            type: 'string',
                            min: 2,
                            max: 200,
                            message: t('min.2.max.200.chars'),
                          },
                        ]}
                        hidden={item.locale !== defaultLang}
                      >
                        <Input />
                      </Form.Item>
                    ))}
                  </Col>
                  <Col span={24}>
                    {languages.map((item) => (
                      <Form.Item
                        key={'description' + item.id}
                        label={t('description')}
                        name={`description[${item.locale}]`}
                        rules={[
                          {
                            required: item?.locale === defaultLang,
                            message: t('required'),
                          },
                          {
                            type: 'string',
                            min: 2,
                            max: 200,
                            message: t('min.2.max.200.chars'),
                          },
                        ]}
                        hidden={item.locale !== defaultLang}
                      >
                        <TextArea rows={3} />
                      </Form.Item>
                    ))}
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card title={t('pricing')}>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item
                      label={t('min.qty')}
                      name='min_qty'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <InputNumber min={0} className='w-100' />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={t('max.qty')}
                      name='max_qty'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <InputNumber min={0} className='w-100' />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={t('tax')}
                      name='tax'
                      rules={[
                        {
                          validator(_, value) {
                            if (value && (value < 0 || value > 100)) {
                              return Promise.reject(
                                new Error(t('must.be.between.0.and.100')),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber className='w-100' addonAfter='%' />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={t('add.quantity.per.click')}
                      name='interval'
                      rules={[
                        { required: true, message: t('required') },
                        {
                          type: 'number',
                          min: 0,
                          message: t('must.be.positive'),
                        },
                      ]}
                      help={error?.interval ? error.interval[0] : null}
                      validateStatus={error?.interval ? 'error' : 'success'}
                    >
                      <InputNumber className='w-100' />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card title={t('additions')}>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item
                      label={t('active')}
                      name='active'
                      valuePropName='checked'
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={t('vegetarian')}
                      name='vegetarian'
                      valuePropName='checked'
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label={t(`nutrition.${nutrition ? 'on' : 'off'}`)}
                      valuePropName='checked'
                    >
                      <Switch
                        checked={nutrition}
                        onChange={(e) => setNutrition(e)}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            {nutrition && (
              <Col span={24}>
                <Card title={t('nutritional.value.of.product')}>
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item
                        rules={[{ required: true, message: t('required') }]}
                        label={t('kcal')}
                        name='kcal'
                      >
                        <InputNumber min={0} className='w-100' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        rules={[{ required: true, message: t('required') }]}
                        label={t('carbs')}
                        name='carbs'
                      >
                        <InputNumber min={0} className='w-100' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        rules={[{ required: true, message: t('required') }]}
                        label={t('protein')}
                        name='protein'
                      >
                        <InputNumber min={0} className='w-100' />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        rules={[{ required: true, message: t('required') }]}
                        label={t('fats')}
                        name='fats'
                      >
                        <InputNumber min={0} className='w-100' />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
          </Row>
        </Col>
        <Col span={8}>
          <Row>
            <Col span={24}>
              <Card title={t('organization')}>
                <Row>
                  {!isRequest && (
                    <Col span={24}>
                      <Form.Item
                        label={t('shop/restaurant')}
                        name='shop'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <RefetchSearch
                          fetchOptions={fetchUserShopList}
                          onChange={() => {
                            form.setFieldsValue({
                              category: undefined,
                              kitchen: undefined,
                            });
                          }}
                        />
                      </Form.Item>
                    </Col>
                  )}
                  <Col span={24}>
                    <Form.Item
                      label={t('category')}
                      name='category'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <AsyncTreeSelect
                        disabled={!shop?.value}
                        refetch
                        fetchOptions={fetchUserCategoryList}
                        dropdownRender={(menu) => (
                          <>
                            {menu}
                            <div className='p-1'>
                              <Button
                                icon={<PlusOutlined />}
                                className='w-100'
                                onClick={goToAddCategory}
                              >
                                {t('add.category')}
                              </Button>
                            </div>
                          </>
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={t('kitchen')} name='kitchen'>
                      <InfiniteSelect
                        allowClear={false}
                        fetchOptions={fetchKitchens}
                        hasMore={hasMore.kitchen}
                        disabled={!shop?.value}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={t('brand')} name='brand'>
                      <DebounceSelect fetchOptions={fetchUserBrandList} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label={t('unit')}
                      name='unit'
                      rules={[{ required: true, message: t('required') }]}
                    >
                      <DebounceSelect fetchOptions={fetchUnits} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={24}>
              <Card title={t('media')}>
                <Row>
                  <Col span={24}>
                    <Form.Item
                      name='images'
                      rules={[
                        {
                          required: !fileList?.length,
                          message: t('required'),
                        },
                      ]}
                    >
                      <MediaUpload
                        type='products'
                        imageList={fileList}
                        setImageList={setFileList}
                        form={form}
                        multiple={true}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Button type='primary' htmlType='submit' loading={loadingBtn}>
        {t('next')}
      </Button>
    </Form>
  );
};

export default ProductsIndex;
