import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Spin,
  Switch,
} from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, removeFromMenu, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import Paystack from 'assets/images/paystack.svg';
import Selcom from 'assets/images/selcom.png';
import { FaPaypal } from 'react-icons/fa';
import { SiStripe, SiRazorpay, SiFlutter } from 'react-icons/si';
import { paymentPayloadService } from 'services/paymentPayload';
import { AsyncSelect } from 'components/async-select';
import currencyService from 'services/currency';
import { fetchPaymentPayloads } from 'redux/slices/paymentPayload';
import MediaUpload from 'components/upload';

const PaymentPayloadEdit = () => {
  const { t } = useTranslation();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePayment, setActivePayment] = useState(null);
  const [image, setImage] = useState(
    activeMenu.data?.image ? [activeMenu.data?.image] : [],
  );
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );

  useEffect(() => {
    return () => {
      const data = form.getFieldsValue(true);
      dispatch(setMenuData({ activeMenu, data }));
    };
    // eslint-disable-next-line
  }, []);

  const createImage = (name) => {
    return {
      name,
      url: name,
    };
  };

  const getPayload = (id) => {
    setLoading(true);
    paymentPayloadService
      .getById(id)
      .then(({ data }) => {
        setActivePayment({
          label: data?.payment?.tag,
          value: data?.payment?.id,
          key: data?.payment?.id,
        });
        form.setFieldsValue({
          ...data.payload,
          payment_id: data?.payment.tag,
          paypal_validate_ssl: Boolean(data?.payload?.paypal_validate_ssl),
          sandbox:
            data?.payload?.sandbox === 1 || data?.payload?.sandbox === 0
              ? Boolean(data?.payload?.sandbox)
              : undefined,
        });
        setImage([createImage(data?.payload.logo)]);
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  };

  const onFinish = (values) => {
    delete values.payment_id;
    if (activePayment?.label === 'flutterWave' && !image[0]) {
      toast.error(t('choose.payload.image'));
      return;
    }
    setLoadingBtn(true);
    const body = {
      payment_id: activePayment.value,
      payload: {
        ...values,
        logo: image[0] ? image[0].name : undefined,
        currency: values.currency?.label || values.currency,
        paypal_validate_ssl: values?.paypal_validate_ssl
          ? Number(values.paypal_validate_ssl)
          : undefined,
        sandbox: Number(Boolean(values?.sandbox)),
      },
    };

    paymentPayloadService
      .update(id, body)
      .then(() => {
        const nextUrl = 'payment-payloads';
        toast.success(t('successfully.updated'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchPaymentPayloads({}));
        });
        navigate(`/${nextUrl}`);
      })
      .finally(() => setLoadingBtn(false));
  };

  useEffect(() => {
    if (activeMenu.refetch) {
      getPayload(id);
    }
  }, [activeMenu.refetch]);

  const handleAddIcon = (data) => {
    switch (data) {
      case 'Paypal':
        return <FaPaypal size={80} />;
      case 'Selcom':
        return <img src={Selcom} alt='img' width='80' height='80' />;
      case 'Stripe':
        return <SiStripe size={80} />;
      case 'Razorpay':
        return <SiRazorpay size={80} />;
      case 'Paystack':
        return <img src={Paystack} alt='img' width='80' height='80' />;
      case 'flutterWave':
        return <SiFlutter size={80} />;
      default:
        return null;
    }
  };

  return (
    <Card title={t('edit.payment.payloads')} className='h-100'>
      {!loading ? (
        <Form
          name='edit.payment.payloads'
          layout='vertical'
          onFinish={onFinish}
          form={form}
          initialValues={{ ...activeMenu.data }}
          className='d-flex flex-column h-100'
        >
          <Row gutter={12}>
            <Col
              span={
                activePayment?.label === 'cash' ||
                activePayment?.label === 'wallet'
                  ? 12
                  : 24
              }
            >
              <Form.Item
                label={t('payment')}
                name='payment_id'
                rules={[
                  {
                    required: true,
                    message: t('required'),
                  },
                ]}
              >
                <Select
                  notFoundContent={
                    loading ? <Spin size='small' /> : 'no results'
                  }
                  allowClear
                  disabled
                />
              </Form.Item>
            </Col>

            {activePayment?.label === 'cash' ||
            activePayment?.label === 'wallet' ? (
              ''
            ) : (
              <>
                <Col
                  span={24}
                  className='d-flex justify-content-center mt-4 mb-5'
                >
                  {handleAddIcon(activePayment?.label)}
                </Col>

                {activePayment?.label === 'paystack' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('paystack.pk')}
                        name='paystack_pk'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('paystack.sk')}
                        name='paystack_sk'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>{' '}
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label === 'selcom' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('selcom.key')}
                        name='selcom_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('selcom.secret')}
                        name='selcom_secret'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('selcom.vendor_id')}
                        name='selcom_vendor_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>{' '}
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </>
                ): activePayment?.label === 'paypal' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('paypal.mode')}
                        name='paypal_mode'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Select
                          options={[
                            { value: 'live', label: t('live') },
                            { value: 'sandbox', label: t('sandbox') },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('paypal.currency')}
                        name='paypal_currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title} (${item.symbol || ''})`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('paypal.sandbox.client.id')}
                        name='paypal_sandbox_client_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('paypal.sandbox.client.secret')}
                        name='paypal_sandbox_client_secret'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('paypal.live.client.id')}
                        name='paypal_live_client_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('paypal.live.client.secret')}
                        name='paypal_live_client_secret'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label === 'stripe' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('stripe.pk')}
                        name='stripe_pk'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('stripe.sk')}
                        name='stripe_sk'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>{' '}
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label === 'razorpay' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('razorpay.key')}
                        name='razorpay_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('razorpay.secret')}
                        name='razorpay_secret'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>{' '}
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label === 'flutterWave' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('payload.title')}
                        name='title'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('payload.description')}
                        name='description'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('flw_sk')}
                        name='flw_sk'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item rules={[{ required: true }]} label={t('logo')}>
                        <MediaUpload
                          type='brands'
                          imageList={image}
                          setImageList={setImage}
                          form={form}
                          multiple={false}
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label?.toLowerCase() === 'mollie' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('partner.id')}
                        name='partner_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('profile.id')}
                        name='profile_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('secret.key')}
                        name='secret_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item rules={[{ required: true }]} label={t('logo')}>
                        <MediaUpload
                          type='brands'
                          imageList={image}
                          setImageList={setImage}
                          form={form}
                          multiple={false}
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label?.toLowerCase() === 'moya-sar' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('public.key')}
                        name='public_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('secret.key')}
                        name='secret_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('secret.token')}
                        name='secret_token'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item rules={[{ required: true }]} label={t('logo')}>
                        <MediaUpload
                          type='brands'
                          imageList={image}
                          setImageList={setImage}
                          form={form}
                          multiple={false}
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label?.toLowerCase() === 'paytabs' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('server.key')}
                        name='server_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('profile.id')}
                        name='profile_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('client.key')}
                        name='client_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label?.toLowerCase() === 'zain-cash' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('url')}
                        name='url'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('msisdn')}
                        name='msisdn'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('merchantId')}
                        name='merchantId'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('key')}
                        name='key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label?.toLowerCase() === 'mercado-pago' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('token')}
                        name='token'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('currency')}
                        name='currency'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <AsyncSelect
                          placeholder={t('select.currency')}
                          valuePropName='label'
                          defaultValue={{
                            value: defaultCurrency.id,
                            label: defaultCurrency.title,
                          }}
                          fetchOptions={() =>
                            currencyService.getAll().then(({ data }) => {
                              return data
                                .filter((item) => item.active)
                                .map((item) => ({
                                  value: item.id,
                                  label: `${item.title}`,
                                  key: item.id,
                                }));
                            })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('sandbox')}
                        name='sandbox'
                        valuePropName='checked'
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </>
                ) : activePayment?.label === 'pay-fast' ? (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('merchant.id')}
                        name='merchant_id'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('merchant.key')}
                        name='merchant_key'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('pass.phrase')}
                        name='pass_phrase'
                        rules={[{ required: true, message: t('required') }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('sandbox')}
                        name='sandbox'
                        valuePropName='checked'
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </>
                ) : null}
              </>
            )}
          </Row>
          <div className='flex-grow-1 d-flex flex-column justify-content-end'>
            <div className='pb-5'>
              <Button
                type='primary'
                htmlType='submit'
                loading={loadingBtn}
                disabled={loadingBtn}
              >
                {t('submit')}
              </Button>
            </div>
          </div>
        </Form>
      ) : (
        <div className='d-flex justify-content-center align-items-center'>
          <Spin size='large' className='py-5' />
        </div>
      )}
    </Card>
  );
};

export default PaymentPayloadEdit;
