import React, { useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { RefetchSearch } from 'components/refetch-search';
import MediaUpload from 'components/upload';
import { shallowEqual, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import categoryService from 'services/category';
import { useLocation } from 'react-router-dom';

export default function ShopCategoryForm({ form, handleSubmit, error }) {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const location = useLocation();

  //states
  const [image, setImage] = useState(
    activeMenu.data?.image ? activeMenu.data?.image : [],
  );
  const [loadingBtn, setLoadingBtn] = useState(false);

  // fetch functions
  async function fetchUserCategoryList(search) {
    const params = { perPage: 100, type: 'shop', search };
    return categoryService.getAll(params).then((res) => {
      if (location?.state?.uuid) {
        return res.data
          .filter((item) => item.uuid !== location?.state?.uuid)
          .map((item) => ({
            label: item.translation?.title,
            value: item.id,
            key: item.id,
          }));
      } else {
        return res.data.map((item) => ({
          label: item.translation?.title,
          value: item.id,
          key: item.id,
        }));
      }
    });
  }

  //submit form
  const onFinish = (values) => {
    setLoadingBtn(true);
    handleSubmit(values, image).finally(() => setLoadingBtn(false));
  };

  return (
    <Form
      name='shop-category-form'
      layout='vertical'
      onFinish={onFinish}
      initialValues={{
        active: true,
        ...activeMenu.data,
        input: activeMenu.data?.input ?? 32767,
      }}
      form={form}
    >
      <Row gutter={12}>
        <Col span={12}>
          {languages.map((item) => (
            <Form.Item
              label={t('name')}
              name={`title[${item?.locale || 'en'}]`}
              key={item?.locale}
              hidden={item?.locale !== defaultLang}
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
            >
              <Input />
            </Form.Item>
          ))}
        </Col>
        <Col span={12}>
          {languages.map((item) => (
            <Form.Item
              label={t('description')}
              name={`description[${item?.locale || 'en'}]`}
              key={item?.locale}
              hidden={item?.locale !== defaultLang}
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
            >
              <TextArea rows={2} />
            </Form.Item>
          ))}
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('keywords')}
            name='keywords'
            rules={[{ required: true, message: t('required') }]}
          >
            <Select mode='tags' style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        {!location?.state?.isParent && location?.state?.type !== 'clone' && (
          <Col span={12}>
            <Form.Item
              label={t('parent.category')}
              name='parent_id'
              // rules={[{ required: true, message: t('required') }]}
            >
              <RefetchSearch allowClear fetchOptions={fetchUserCategoryList} />
            </Form.Item>
          </Col>
        )}
        <Col span={12}>
          <Form.Item
            label={t('position')}
            name='input'
            rules={[
              { required: true, message: t('required') },
              {
                type: 'number',
                min: 0,
                max: 32767,
                message: t('must.be.between.0.and.32767'),
              },
            ]}
          >
            <InputNumber className='w-100' />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label={t('image')}
            name='images'
            rules={[
              {
                required: !image.length,
                message: t('required'),
              },
            ]}
          >
            <MediaUpload
              type='categories'
              imageList={image}
              setImageList={setImage}
              form={form}
              multiple={false}
            />
          </Form.Item>
        </Col>
        <Col span={2}>
          <Form.Item label={t('active')} name='active' valuePropName='checked'>
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Button type='primary' htmlType='submit' loading={loadingBtn}>
        {t('submit')}
      </Button>
    </Form>
  );
}
