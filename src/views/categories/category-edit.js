import React, { useState, useEffect } from 'react';
import { Card, Form, Spin } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import categoryService from 'services/category';
import { useTranslation } from 'react-i18next';
import { fetchCategories } from 'redux/slices/category';
import useDidUpdate from 'helpers/useDidUpdate';
import getLanguageFields from 'helpers/getLanguageFields';
import createImage from 'helpers/createImage';
import CategoryList from './category-list';
import CategoryForm from './category-form';

const CategoryEdit = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { state } = useLocation();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { languages } = useSelector((state) => state.formLang, shallowEqual);
  const { params } = useSelector((state) => state.category, shallowEqual);

  const [categoryId, setCategoryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { uuid } = useParams();

  const paramsData = {
    ...params,
    type: state?.parentId ? 'sub_main' : 'main',
    parent_id: state?.parentId,
  };

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      batch(() => {
        dispatch(setMenuData({ activeMenu, data }));
        dispatch(fetchCategories(paramsData));
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  }, [uuid, state?.parentId]);

  const getCategory = (alias) => {
    if (!alias) return;
    setLoading(true);
    categoryService
      .getById(alias)
      .then((res) => {
        let category = res?.data;
        console.log('category', category);

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
        setCategoryId(category.id);
        form.setFieldsValue(body);
        dispatch(setMenuData({ activeMenu, data: body }));
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const handleSubmit = (body) => {
    return categoryService.update(uuid, body);
  };

  return (
    <>
      <Card
        title={state?.parentId ? t('edit.sub.category') : t('edit.category')}
        extra={<LanguageList />}
      >
        {!loading ? (
          <CategoryForm form={form} handleSubmit={handleSubmit} />
        ) : (
          <div className='d-flex justify-content-center align-items-center py-5'>
            <Spin size='large' className='mt-5 pt-5' />
          </div>
        )}
      </Card>
      {!!categoryId && !state?.parentId && (
        <CategoryList type='sub_main' parentId={categoryId} />
      )}
    </>
  );
};
export default CategoryEdit;
