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
import { DebounceSelect } from 'components/search';
import MediaUpload from 'components/upload';
import { useTranslation } from 'react-i18next';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import categoryService from 'services/seller/category';
import getTranslationFields from 'helpers/getTranslationFields';
import { toast } from 'react-toastify';
import { removeFromMenu } from 'redux/slices/menu';
import { fetchSellerCategory } from 'redux/slices/category';

export default function CategoryForm({ form, handleSubmit, request = true }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { params } = useSelector((state) => state.requestModels, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const { state } = useLocation();

  //state
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [image, setImage] = useState(
    activeMenu.data?.image ? activeMenu.data?.image : [],
  );

  //functions
  const fetchUserCategoryList = (search) => {
    const params = {
      perPage: 100,
      type: state?.parentId ? 'main' : 'sub_shop',
      active: 1,
      search,
    };

    return categoryService.selectMyCategoryPaginate(params).then((res) =>
      res.data.map((item) => ({
        label: item?.translation?.title,
        value: item?.id,
        key: item?.id,
      })),
    );
  };

  //submit form
  const onFinish = (values) => {
    const createCategoryBody = {
      title: getTranslationFields(languages, values),
      description: getTranslationFields(languages, values, 'description'),
      keywords: values?.keywords?.join(','),
      parent_id: state?.parentId || values?.parent_id?.value,
      input: values?.input,
      images: image?.map((item) => item?.name),
      active: Number(values?.active),
      type: state?.parentId ? 'sub_main' : 'main',
    };
    const requestBody = {
      type: 'category',
      id: values?.id,
      data: {
        ...values,
        keywords: values?.keywords?.join(','),
        parent_id: state?.parentId || values?.parent_id?.value,
        input: values?.input,
        images: image?.map((item) => item?.name),
        active: Number(values?.active),
        type: state?.parentId ? 'sub_main' : 'main',
      },
    };
    const submitBody = request ? requestBody : createCategoryBody;
    setLoadingBtn(true);
    handleSubmit(submitBody)
      .then(() => {
        const nextUrl = state?.parentId
          ? `seller/category/${state?.parentUuid}`
          : 'seller/categories';
        const paramsData = {
          ...params,
          shop_id: myShop?.id,
          type: state?.parentId ? 'sub_main' : 'main',
          parent_id: state?.parentId,
        };
        toast.success(t('successfully.updated'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchSellerCategory(paramsData));
        });
        navigate(`/${nextUrl}`, { state: { tab: 'request' } });
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  return (
    <Form
      name='category-form'
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
            rules={[{ required: true, message: t('required') }]}
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
              <DebounceSelect fetchOptions={fetchUserCategoryList} />
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
