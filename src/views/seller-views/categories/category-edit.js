import React, { useState, useEffect } from 'react';
import { Card, Form, Spin } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import LanguageList from 'components/language-list';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from 'redux/slices/menu';
import sellerCategory from 'services/seller/category';
import { useTranslation } from 'react-i18next';
import requestModelsService from 'services/seller/request-models';
import useDidUpdate from 'helpers/useDidUpdate';
import { fetchSellerCategory } from 'redux/slices/category';
import getLanguageFields from 'helpers/getLanguageFields';
import createImage from 'helpers/createImage';
import SellerCategories from './index';
import CategoryForm from './category-form';

const SellerCategoryEdit = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [categoryId, setCategoryId] = useState(null);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { params } = useSelector((state) => state.requestModels, shallowEqual);
  const { user } = useSelector((state) => state.auth, shallowEqual);
  const { state } = useLocation();
  const { languages } = useSelector((state) => state.formLang, shallowEqual);

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const { uuid } = useParams();

  useEffect(() => {
    getCategory(uuid);
    dispatch(disableRefetch(activeMenu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid, state?.parentId]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      getCategory(uuid);
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      batch(() => {
        dispatch(setMenuData({ activeMenu, data }));
        dispatch(
          fetchSellerCategory({
            ...params,
            type: state?.parentId ? 'sub_main' : 'main',
            parent_id: state?.parentId,
            shop_id: user?.shop_id,
          }),
        );
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCategory = (alias) => {
    if (!alias) return;
    setLoading(true);
    sellerCategory
      .getById(alias)
      .then((res) => {
        let category = res.data;
        const body = {
          ...category,
          ...getLanguageFields(languages, category, ['title', 'description']),
          image: [createImage(category?.img)],
          keywords: category?.keywords.split(','),
          id: category?.id,
          input: category?.input,
          parent_id: {
            label: category?.parent?.translation?.title,
            value: category?.parent_id,
            key: category?.parent_id,
          },
        };
        setCategoryId(category.id);
        dispatch(setMenuData({ activeMenu, data: body }));
        form.setFieldsValue(body);
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const handleSubmit = (body) => {
    return requestModelsService.requestChange(body);
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
        <SellerCategories type='sub_main' parentId={categoryId} />
      )}
    </>
  );
};
export default SellerCategoryEdit;
