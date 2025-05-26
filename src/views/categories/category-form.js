import React, { useState } from 'react';
import {
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  InputNumber,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { RefetchSearch } from 'components/refetch-search';
import MediaUpload from 'components/upload';
import { useTranslation } from 'react-i18next';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import categoryService from 'services/category';
import { DebounceSelect } from 'components/search';
import { toast } from 'react-toastify';
import { removeFromMenu } from 'redux/slices/menu';
import { fetchCategories } from 'redux/slices/category';
import getTranslationFields from 'helpers/getTranslationFields';

export default function CategoryForm({ form, handleSubmit, error }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const { params } = useSelector((state) => state.category, shallowEqual);

  //states
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [image, setImage] = useState(
    activeMenu.data?.image ? activeMenu.data?.image : [],
  );

  const paramsData = {
    ...params,
    type: state?.parentId ? 'sub_main' : 'main',
    parent_id: state?.parentId,
  };

  //request functions
  const fetchUserCategoryList = (search = '') => {
    const params = {
      perPage: 100,
      type: state?.parentId ? 'main' : 'sub_shop',
      active: 1,
      search: search?.length ? search : undefined,
    };
    return categoryService.selectPaginate(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  // submit form
  const onFinish = (values) => {
    const body = {
      ...values,
      title: getTranslationFields(languages, values),
      description: getTranslationFields(languages, values, 'description'),
      type: state?.parentId ? 'sub_main' : 'main',
      active: Number(values?.active),
      keywords: values?.keywords?.join(','),
      parent_id: state?.parentId || values?.parent_id?.value,
      images: image?.map((item) => item?.name),
    };
    setLoadingBtn(true);
    handleSubmit(body)
      .then(() => {
        const nextUrl = state?.parentId
          ? `category/${state?.parentUuid}`
          : 'catalog/categories';
        toast.success(t('successfully.updated'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchCategories(paramsData));
        });

        navigate(`/${nextUrl}`);
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  return (
    <Form
      name='basic'
      layout='vertical'
      onFinish={onFinish}
      initialValues={{
        active: true,
        ...activeMenu.data,
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
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <Select mode='tags' style={{ width: '100%' }}></Select>
          </Form.Item>
        </Col>
        {!state?.parentId && (
          <Col span={12}>
            <Form.Item
              label={t('parent.category')}
              name='parent_id'
              rules={[{ required: true, message: t('required') }]}
            >
              <RefetchSearch refetch fetchOptions={fetchUserCategoryList} />
            </Form.Item>
          </Col>
        )}
        <Col span={12}>
          <Form.Item
            name='input'
            label={t('position')}
            rules={[
              {
                required: true,
                message: t('required'),
              },
            ]}
          >
            <InputNumber
              min={0}
              parser={(value) => parseInt(value, 10)}
              max={32767}
              className='w-100'
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            label={t('image')}
            name='images'
            rules={[
              {
                required: !image?.length,
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
