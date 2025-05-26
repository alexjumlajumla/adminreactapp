import React, { useState, useEffect } from 'react';
import { Card, Form, Spin } from 'antd';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { shallowEqual, useDispatch, useSelector, batch } from 'react-redux';
import { disableRefetch, removeFromMenu, setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import { fetchCareerCategories } from 'redux/slices/career-category';
import createImage from 'helpers/createImage';
import getLanguageFields from 'helpers/getLanguageFields';
import getTranslationFields from 'helpers/getTranslationFields';
import CareerCategoryForm from './career-category-form';

const CareerCategoryEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const { uuid } = useParams();
  const { params } = useSelector((state) => state.careerCategory, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategory = (alias) => {
    setLoading(true);
    categoryService
      .getById(alias)
      .then((res) => {
        let category = res.data;

        const body = {
          ...category,
          ...getLanguageFields(languages, category, ['title', 'description']),
          image: category?.img?.length ? [createImage(category?.img)] : [],
          keywords: category.keywords.split(','),
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
      keywords: values?.keywords?.join(','),
      images: image?.map((item) => item?.name),
      active: values?.active ? 1 : 0,
      parent_id: undefined,
      type: 'career',
    };
    const nextUrl = 'catalog/career-categories';

    return categoryService
      .update(uuid, body)
      .then(() => {
        toast.success(t('successfully.updated'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchCareerCategories(params));
        });
        navigate(`/${nextUrl}`);
      })
      .catch((err) => setError(err.response.data.params));
  };

  useEffect(() => {
    if (activeMenu.refetch) getCategory(uuid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  return (
    <Card title={t('edit.career.category')} extra={<LanguageList />}>
      {!loading ? (
        <CareerCategoryForm
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
export default CareerCategoryEdit;
