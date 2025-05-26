import React, { useEffect } from 'react';
import { Card, Form } from 'antd';
import { useLocation } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import CategoryForm from './category-form';

const CategoryAdd = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { state } = useLocation();

  const [form] = Form.useForm();

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (body) => {
    return categoryService.create(body);
  };

  return (
    <Card
      title={state?.parentId ? t('add.sub.category') : t('add.category')}
      extra={<LanguageList />}
    >
      <CategoryForm form={form} handleSubmit={handleSubmit} />
    </Card>
  );
};
export default CategoryAdd;
