import React, { useState, useEffect } from 'react';
import { Card, Form } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { removeFromMenu, setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { fetchCareerCategories } from 'redux/slices/career-category';
import { useTranslation } from 'react-i18next';
import getTranslationFields from 'helpers/getTranslationFields';
import CareerCategoryForm from './career-category-form';

const CareerCategoryAdd = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { params } = useSelector((state) => state.careerCategory, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);
  const [form] = Form.useForm();
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (values, image) => {
    const body = {
      title: getTranslationFields(languages, values),
      description: getTranslationFields(languages, values, 'description'),
      keywords: values?.keywords?.join(','),
      images: image?.map((item) => item?.name),
      active: values?.active ? 1 : 0,
      parent_id: undefined,
      type: 'career',
    };
    const nextUrl = 'catalog/career-categories';
    return categoryService
      .create(body)
      .then(() => {
        toast.success(t('successfully.created'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchCareerCategories(params));
        });
        navigate(`/${nextUrl}`);
      })
      .catch((err) => setError(err.response.data.params));
  };

  return (
    <Card title={t('add.category')} extra={<LanguageList />}>
      <CareerCategoryForm
        form={form}
        handleSubmit={handleSubmit}
        error={error}
      />
    </Card>
  );
};
export default CareerCategoryAdd;
