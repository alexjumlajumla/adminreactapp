import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Space } from 'antd';
import ShopAddData from './shop-add-data';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setMenuData } from 'redux/slices/menu';
import shopService from 'services/seller/shop';
import { useTranslation } from 'react-i18next';
import getDefaultLocation from 'helpers/getDefaultLocation';
import { SHOP_EMAIL_STATUSES } from '../../../constants';

const ShopMain = ({ next }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { settings } = useSelector(
    (state) => state.globalSettings,
    shallowEqual,
  );

  const [location, setLocation] = useState(
    activeMenu?.data?.location
      ? {
          lat: parseFloat(activeMenu?.data?.location?.latitude),
          lng: parseFloat(activeMenu?.data?.location?.longitude),
        }
      : getDefaultLocation(settings),
  );
  const [loadingBtn, setLoadingBtn] = useState(false);
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const [logoImage, setLogoImage] = useState(
    activeMenu.data?.logo_img ? [activeMenu.data?.logo_img] : [],
  );
  const [backImage, setBackImage] = useState(
    activeMenu.data?.background_img ? [activeMenu.data?.background_img] : [],
  );

  const emailStatusOptions = useMemo(
    () =>
      SHOP_EMAIL_STATUSES.map((item) => ({
        label: t(item),
        value: item,
        key: item,
      })),
    [],
  );

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      data.open_time = JSON.stringify(data?.open_time);
      data.close_time = JSON.stringify(data?.close_time);
      dispatch(
        setMenuData({ activeMenu, data: { ...activeMenu.data, ...data } }),
      );
    };
    // eslint-disable-next-line
  }, []);

  const onFinish = (values) => {
    setLoadingBtn(true);
    const email_statuses = values?.emailStatuses?.length
      ? Object.assign(
          {},
          ...values?.emailStatuses?.map((item, index) => ({
            [`email_statuses[${index}]`]: item?.value || item,
          })),
        )
      : [];
    const body = {
      ...values,
      'images[0]': logoImage[0]?.name,
      'images[1]': backImage[0]?.name,
      delivery_time_type: values.delivery_time_type,
      delivery_time_to: values.delivery_time_to,
      delivery_time_from: values.delivery_time_from,
      categories: values.categories.map((e) => e.value),
      user_id: values.user.value,
      visibility: Number(values.visibility),
      'location[latitude]': location.lat,
      'location[longitude]': location.lng,
      user: undefined,
      delivery_time: 0,
      type: myShop.type === 'shop' ? 'shop' : 'restaurant',
      tags: values.tags.map((e) => e.value),
      wifi_name: values?.wifi_name || '',
      wifi_password: values?.wifi_password || '',
      order_payment:
        values?.order_payment?.value || values?.order_payment || undefined,
      ...email_statuses,
      emailStatuses: undefined,
      new_order_after_payment: values?.new_order_after_payment ? 1 : 0,
    };
    delete body?.background_img;
    delete body?.logo_img;
    delete body?.emailStatuses;
    shopUpdate(values, body);
  };

  function shopUpdate(values, params) {
    shopService
      .update(params)
      .then(() => {
        dispatch(
          setMenuData({
            activeMenu,
            data: values,
          }),
        );
        next();
      })
      .finally(() => setLoadingBtn(false));
  }

  return (
    <>
      <Form
        form={form}
        name='basic'
        layout='vertical'
        onFinish={onFinish}
        initialValues={{
          visibility: true,
          status: 'new',
          ...activeMenu.data,
        }}
      >
        <ShopAddData
          logoImage={logoImage}
          setLogoImage={setLogoImage}
          backImage={backImage}
          setBackImage={setBackImage}
          form={form}
          location={location}
          setLocation={setLocation}
          emailStatusOptions={emailStatusOptions}
        />
        <Space>
          <Button type='primary' htmlType='submit' loading={loadingBtn}>
            {t('next')}
          </Button>
        </Space>
      </Form>
    </>
  );
};
export default ShopMain;
