import React, { useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { removeFromMenu, setRefetch } from 'redux/slices/menu';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Paystack from 'assets/images/paystack.svg';
import Selcom from 'assets/images/selcom.png';
import { FaPaypal } from 'react-icons/fa';
import { SiStripe, SiRazorpay, SiFlutter } from 'react-icons/si';
import { fetchPaymentPayloads } from 'redux/slices/paymentPayload';
import { paymentPayloadService } from 'services/paymentPayload';
import paymentService from 'services/payment';
import { AsyncSelect } from 'components/async-select';
import currencyService from 'services/currency';
import i18n from 'configs/i18next';
import MediaUpload from 'components/upload';

export default function PaymentPayloadAdd() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentList, setPaymentList] = useState([]);
  const [activePayment, setActivePayment] = useState(null);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [image, setImage] = useState(
    activeMenu.data?.image ? [activeMenu.data?.image] : [],
  );
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFinish = (values) => {
    delete values.payment_id;
    if (activePayment?.label === 'FlutterWave' && !image[0]) {
      toast.error(t('choose.payload.image'));
      return;
    }
    setLoadingBtn(true);
    paymentPayloadService
      .create({
        payment_id: activePayment.value,
        payload: {
          ...values,
          logo: image[0] ? image[0].name : undefined,
          paypal_currency: values.paypal_currency?.label,
          currency: values.currency?.label || values.currency,
          paypal_validate_ssl: values?.paypal_validate_ssl
            ? Number(values?.paypal_validate_ssl)
            : undefined,
          sandbox:
            typeof values?.sandbox !== 'undefined'
              ? Number(Boolean(values?.sandbox))
              : undefined,
        },
      })
      .then(() => {
        const nextUrl = 'payment-payloads';
        toast.success(t('successfully.created'));
        batch(() => {
          dispatch(removeFromMenu({ ...activeMenu, nextUrl }));
          dispatch(fetchPaymentPayloads({}));
          dispatch(setRefetch(activeMenu));
        });
        navigate(`/${nextUrl}`);
      })
      .catch((err) => {
        toast.dismiss();
        toast.error(err?.response?.data?.params?.payment_id[0]);
      })
      .finally(() => setLoadingBtn(false));
  };

  async function fetchPayment() {
    setLoading(true);
    return paymentService
      .getAll()
      .then(({ data }) => {
        const body = data
          .filter((item) => item.tag !== 'wallet')
          .filter((item) => item.tag !== 'cash')
          .map((item) => ({
            label: item.tag[0].toUpperCase() + item.tag.substring(1),
            value: item.id,
            key: item.id,
          }));
        setPaymentList(body);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchPayment();
  }, []);

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
      case 'Flutterwave':
        return <SiFlutter size={80} />;
      default:
        return null;
    }
  };

  const handleChangePayment = (e) => {
    const selectedPayment = paymentList.find((payment) => payment.value === e);
    switch (selectedPayment.label) {
      case 'Paypal': {
        form.setFieldsValue({
          paypal_validate_ssl: true,
          paypal_locale: i18n.language,
          paypal_currency: {
            label: defaultCurrency?.title,
            value: defaultCurrency?.id,
          },
        });
        break;
      }
      case 'Selcom': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Stripe': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Razorpay': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Paystack': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'FlutterWave': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Mollie': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Moya-sar': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Paytabs': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Zain-cash': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
        });
        break;
      }
      case 'Mercado-pago': {
        form.setFieldsValue({
          currency: defaultCurrency?.title,
          sandbox: true,
        });
        break;
      }
      case 'Pay-fast': {
        form.setFieldsValue({
          sandbox: true,
        });
        break;
      }
      default:
        form.resetFields();
    }
    setActivePayment(selectedPayment);
  };

  return (
    <Card title={t('add.payment.payloads')} className='h-100'>
      <Form
        layout='vertical'
        name='user-address'
        form={form}
        onFinish={onFinish}
      >
        <Row gutter={12}>
          <Col
            span={
              activePayment?.label === 'Cash' ||
              activePayment?.label === 'Wallet'
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
                notFoundContent={loading ? <Spin size='small' /> : 'no results'}
                allowClear
                options={paymentList}
                onSelect={handleChangePayment}
              />
            </Form.Item>
          </Col>

          {activePayment?.label === 'Cash' ||
          activePayment?.label === 'Wallet' ? (
            ''
          ) : (
            <>
              <Col
                span={24}
                className='d-flex justify-content-center mt-4 mb-5'
              >
                {handleAddIcon(activePayment?.label)}
              </Col>
              {activePayment?.label === 'Paystack' ? (
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
              ) : activePayment?.label === 'Selcom' ? (
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
              ): activePayment?.label === 'Paypal' ? (
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
              ) : activePayment?.label === 'Stripe' ? (
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
              ) : activePayment?.label === 'Razorpay' ? (
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
              ) : activePayment?.label === 'FlutterWave' ? (
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
              ) : activePayment?.label.toLowerCase() === 'mollie' ? (
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
                    <Form.Item label={t('sandbox')} name='sandbox'>
                      <Switch defaultChecked={true} />
                    </Form.Item>
                  </Col>
                </>
              ) : activePayment?.label === 'Pay-fast' ? (
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
    </Card>
  );
}
