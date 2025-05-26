import React, { useState, useEffect } from 'react';
import { Card, Form, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import getLanguageFields from 'helpers/getLanguageFields';
import createImage from 'helpers/createImage';
import useDidUpdate from 'helpers/useDidUpdate';
import CategoryForm from './category-form';

const ShopCategoryClone = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { uuid } = useParams();
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      getCategory(uuid);
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useEffect(() => {
    getCategory(uuid);
    dispatch(disableRefetch(activeMenu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategory = (alias) => {
    if (!alias) return;
    setLoading(true);
    categoryService
      .getById(alias)
      .then((res) => {
        let category = res?.data;

        const body = {
          ...category,
          ...getLanguageFields(languages, category, ['title', 'description']),
          image: [createImage(category.img)],
          keywords: category?.keywords?.split(','),
          parent_id: {
            label: category.parent?.translation?.title,
            value: category.parent_id,
            key: category.parent_id,
          },
        };
        form.setFieldsValue(body);
        dispatch(setMenuData({ activeMenu, data: body }));
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const handleSubmit = (body) => {
    return categoryService.create(body);
  };

  return (
    <Card title={t('category.clone')} extra={<LanguageList />}>
      {!loading ? (
        <CategoryForm form={form} handleSubmit={handleSubmit} />
      ) : (
        <div className='d-flex justify-content-center align-items-center py-5'>
          <Spin size='large' className='mt-5 pt-5' />
        </div>
      )}
    </Card>
  );
};
export default ShopCategoryClone;
