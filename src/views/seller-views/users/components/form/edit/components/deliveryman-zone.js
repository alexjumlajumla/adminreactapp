import { Button, Col, Form, Row } from 'antd';
import MapGif from 'assets/video/map.gif';
import DrawingManager from 'components/drawing-map';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import userService from 'services/seller/user';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setRefetch } from 'redux/slices/menu';

const DeliverymanZone = ({ data }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [triangleCoords, setTriangleCoords] = useState(
    data?.delivery_man_delivery_zone?.length
      ? data?.delivery_man_delivery_zone?.map((item) => ({
          lat: item?.[0],
          lng: item?.[1],
        }))
      : [],
  );
  const [merge, setMerge] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const onFinish = () => {
    if (!data?.id) {
      toast.error(t('no.user.id'));
      return;
    }
    if (triangleCoords.length < 3) {
      toast.warning(t('place.selected.map'));
      return;
    }
    if (!merge) {
      toast.warning(t('place.selected.map'));
      return;
    }
    const body = {
      user_id: data?.id,
      address: triangleCoords.map((item) => ({
        0: item.lat,
        1: item.lng,
      })),
    };
    setLoadingBtn(true);
    userService
      .createAndUpdateDeliverymanZone(body)
      .then(() => {
        dispatch(setRefetch(activeMenu));
        toast.success(t('successfully.updated'));
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  return (
    <Form layout='vertical' form={form} onFinish={onFinish}>
      <Row gutter={12}>
        <Col span={12}>
          <img src={MapGif} alt={t('map.gif')} style={{ object: 'contain' }} />
        </Col>
        <Col span={24}>
          <DrawingManager
            triangleCoords={triangleCoords}
            settriangleCoords={setTriangleCoords}
            setMerge={setMerge}
          />
        </Col>
      </Row>
      <Button
        type='primary'
        htmlType='submit'
        loading={loadingBtn}
        className='mt-4'
      >
        {t('save')}
      </Button>
    </Form>
  );
};

export default DeliverymanZone;
