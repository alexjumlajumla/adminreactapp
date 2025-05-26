import React, { useState, useEffect } from 'react';
import { Card, Form, Spin } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, removeFromMenu, setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { IMG_URL } from 'configs/app-global';
import { fetchShopCategories } from 'redux/slices/shopCategory';
import { useTranslation } from 'react-i18next';
import getLanguageFields from 'helpers/getLanguageFields';
import getTranslationFields from 'helpers/getTranslationFields';
import ShopCategoryForm from './category-form';

const CategoryEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { params } = useSelector((state) => state.shopCategory, shallowEqual);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const { uuid } = useParams();
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createImage = (name) => {
    return {
      name,
      url: IMG_URL + name,
    };
  };

  const getCategory = (alias) => {
    setLoading(true);
    categoryService
      .getById(alias)
      .then((res) => {
        let category = res.data;

        const body = {
          ...getLanguageFields(languages, category, ['title', 'description']),
          image: [createImage(category?.img)],
          keywords: category?.keywords.split(','),
          parent_id: {
            label: category?.parent?.translation?.title,
            value: category?.parent_id,
            key: category?.parent_id,
          },
          input: category?.input ?? 32767,
          active: !!category?.active
        };
        form.setFieldsValue(body);
        dispatch(setMenuData({ activeMenu, data: body }));
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const handleSubmit = (values, image) => {
    const body = {
      title: getTranslationFields(languages, values),
      description: getTranslationFields(languages, values, 'description'),
      type: values.parent_id?.value ? 'sub_shop' : 'shop',
      active: Number(values?.active),
      keywords: values?.keywords?.join(','),
      parent_id: values?.parent_id?.value,
      images: image?.map((image) => image?.name),
      input: values?.input,
    };
    const nextUrl = 'catalog/shop/categories';

    return categoryService
      .update(uuid, body)
      .then(() => {
        toast.success(t('successfully.updated'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchShopCategories(params));
        });
        navigate(`/catalog/shop/categories`);
      })
      .catch((err) => setError(err.response.data.params));
  };

  useEffect(() => {
    if (activeMenu.refetch) {
      getCategory(uuid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  return (
    <Card title={t('edit.category')} extra={<LanguageList />}>
      {!loading ? (
        <ShopCategoryForm
          form={form}
          handleSubmit={handleSubmit}
          error={error}
        />
      ) : (
        <div className='d-flex justify-content-center align-items-center py-5'>
          <Spin size='large' className='mt-5 pt-5' />
        </div>
      )}
    </Card>
  );
};
export default CategoryEdit;
