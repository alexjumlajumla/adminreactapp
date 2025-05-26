import React, { useEffect, useState } from 'react';
import {
  CheckOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row, Space, Spin } from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  clearCart,
  removeFromCart,
  setCartShops,
  clearCartShops,
  setCartTotal,
  addCoupon,
  verifyCoupon,
  removeBag,
  setCartData,
  setCartOrder,
  addOrderNotes,
  setCartTotalCoupon,
  clearData,
  incrementCart,
} from 'redux/slices/cart';
import shopService from 'services/shop';
import getImage from 'helpers/getImage';
import useDidUpdate from 'helpers/useDidUpdate';
import orderService from 'services/order';
import invokableService from 'services/rest/invokable';
import { useTranslation } from 'react-i18next';
import numberToPrice from 'helpers/numberToPrice';
import { getCartData, getCartItems } from 'redux/selectors/cartSelector';
import PreviewInfo from '../../order/preview-info';
import { toast } from 'react-toastify';
import useDebounce from 'helpers/useDebounce';
import transactionService from 'services/transaction';
import moment from 'moment';
import QueryString from 'qs';
import { setRefetch } from 'redux/slices/menu';
import ColumnImage from 'components/column-image';

export default function OrderCart() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { cartItems, cartShops, currentBag, total, coupons, currency, notes } =
    useSelector((state) => state.cart, shallowEqual);
  const filteredCartItems = useSelector((state) => getCartItems(state.cart));
  const data = useSelector((state) => getCartData(state.cart));
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loadingCoupon, setLoadingCoupon] = useState(null);
  const [couponField, setCouponField] = useState('');
  const debouncedCartItems = useDebounce(cartItems, 300);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const deleteCard = (e) => dispatch(removeFromCart(e));

  const clearAll = () => {
    batch(() => {
      dispatch(clearCart());
      dispatch(clearData());
      dispatch(setRefetch(activeMenu));
    });

    if (currentBag !== 0) {
      dispatch(removeBag(currentBag));
    }
  };

  const increment = (item) => {
    if (item.quantity === item?.stockID?.quantity) {
      return;
    }
    if (item.quantity === item.max_qty) {
      return;
    }
    dispatch(incrementCart({ ...item, quantity: 1 }));
  };

  const decrement = (item) => {
    if (item.quantity === 1) {
      return;
    }
    if (item.quantity <= item.min_qty) {
      return;
    }
    dispatch(incrementCart({ ...item, quantity: -1 }));
  };

  function getShops() {
    shopService.getById(data?.shop?.value).then((res) => setShops(res.data));
  }

  useEffect(() => {
    if (data?.shop?.value) {
      getShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearData]);

  function formatProducts(list) {
    const products = list.map((item) => ({
      quantity: item.quantity,
      stock_id: item.stockID ? item.stockID?.id : item.stock?.id,
      addons: item?.addons?.length
        ? item?.addons?.map((addon) => ({
            quantity: addon?.quantity,
            stock_id: addon?.stockID,
          }))
        : undefined,
    }));

    const result = {
      products,
      currency_id: currency?.id,
      coupon: coupons?.[0]?.verified ? coupons?.[0]?.coupon : undefined,
      shop_id: data?.shop?.value,
      type: data?.deliveries?.value,
      address: {
        latitude: data?.address?.lat,
        longitude: data?.address?.lng,
      },
    };
    return QueryString.stringify(result, { addQueryPrefix: true });
  }

  useDidUpdate(() => {
    if (filteredCartItems.length) {
      productCalculate();
    }
  }, [data?.shop, currency]);

  useDidUpdate(() => {
    if (filteredCartItems.length) {
      productCalculate();
    } else {
      dispatch(clearCartShops());
    }
  }, [
    debouncedCartItems,
    currentBag,
    data?.address,
    currency,
    coupons,
    data?.coupon,
    data?.deliveries,
  ]);

  function productCalculate() {
    const products = formatProducts(filteredCartItems);

    setLoading(true);
    orderService
      .calculate(products)
      .then(({ data }) => {
        const product = data.data;
        const items = product.stocks.map((item) => ({
          ...filteredCartItems.find((el) => el.id === item.id),
          ...item,
          ...item?.stock?.countable,
          stock: item?.stock?.stock_extras,
          stocks: item?.stock?.stock_extras,
          stockID: item?.stock,
        }));
        dispatch(setCartShops([{ ...shops, products: items }]));
        const orderData = {
          product_total: product.stocks?.reduce(
            (acc, curr) => acc + (curr?.total_price || curr?.price || 0),
            0,
          ),
          shop_tax: product?.total_shop_tax,
          order_total: product?.total_price,
          delivery_fee: product?.delivery_fee,
          service_fee: product?.service_fee,
          couponOBJ: product?.coupon,
          couponPrice: product?.coupon_price,
        };
        dispatch(setCartTotal(orderData));
      })
      .finally(() => setLoading(false));
  }

  const handleSave = (id) => {
    setOrderId(id);
  };

  const handleCloseInvoice = () => {
    setOrderId(null);
    clearAll();
    toast.success(t('successfully.closed'));
  };

  function handleCheckCoupon(shopId) {
    const data = {
      coupon: couponField,
      shop_id: shopId,
    };

    setLoadingCoupon(shopId);
    invokableService
      .checkCoupon(data)
      .then((res) => {
        const coupon = res.data.id;
        dispatch(setCartData({ coupon, bag_id: currentBag }));
        dispatch(
          verifyCoupon({
            shop_id: shopId,
            price: res.data.price,
            verified: true,
          }),
        );
        dispatch(setCartTotalCoupon(res.data));
      })
      .catch(() =>
        dispatch(
          verifyCoupon({
            shop_id: shopId,
            price: 0,
            verified: false,
          }),
        ),
      )
      .finally(() => setLoadingCoupon(null));
  }

  function createTransaction(id, data) {
    transactionService
      .create(id, data)
      .then((res) => handleSave(res.data.id))
      .finally(() => setLoading(false));
  }

  const handleClick = () => {
    if (!currency) {
      toast.warning(t('please.select.currency'));
      return;
    }
    if (data?.deliveries?.value === 'dine_in') {
      if (!data?.deliveryZone?.value) {
        toast.warning(t('please.select.delivery.zone'));
        return;
      }
      if (!data?.table?.value) {
        toast.warning(t('please.select.table'));
        return;
      }
    }
    if (data?.deliveries?.value === 'delivery' && !data.address) {
      toast.warning(t('please.select.address'));
      return;
    }
    if (data?.deliveries?.value === 'delivery' && !data.delivery_date) {
      toast.warning(t('please.select.deliveryDate'));
      return;
    }
    if (data?.deliveries?.value === 'delivery' && !data.delivery_time) {
      toast.warning(t('shop.closed'));
      return;
    }

    const products = cartShops?.flatMap((item) =>
      item?.products?.map((product) => ({
        stock_id: product?.stockID?.id,
        quantity: product?.quantity,
        bonus: product?.bonus ? product?.bonus : undefined,
        note: notes[product?.stockID?.id],
        addons: product?.addons?.map((addon) => ({
          stock_id: addon?.id,
          quantity: addon?.quantity,
        })),
      })),
    );
    const deliveryBody = {
      user_id: data?.user?.value,
      currency_id: currency?.id,
      rate: currency?.rate,
      shop_id: data?.shop?.value,
      delivery_id: data?.deliveries?.value,
      coupon: coupons[0]?.coupon,
      tax: total.order_tax,
      payment_type: data?.paymentType?.value,
      delivery_date: data?.delivery_date,
      delivery_address_id: data?.address?.address,
      address: {
        address: data?.address?.address,
        office: '',
        house: '',
        floor: '',
      },
      location: {
        latitude: data?.address?.lat,
        longitude: data?.address?.lng,
      },
      delivery_time: data?.delivery_time
        ? moment(data?.delivery_time, 'HH:mm').format('HH:mm')
        : undefined,
      delivery_type: data?.deliveries?.value,
      delivery_type_id: data?.deliveries?.key,
      phone: data?.phone?.toString(),
      table_id: data?.table?.value || undefined,
      products,
    };
    const pickupAndDineInBody = {
      currency_id: currency?.id,
      rate: currency?.rate,
      shop_id: data?.shop?.value,
      coupon: coupons[0]?.coupon,
      tax: total.order_tax,
      payment_type: data?.paymentType?.value,
      delivery_id: data?.deliveries?.value,
      delivery_type: data?.deliveries?.value,
      delivery_type_id: data?.deliveries?.key,
      table_id: data?.table?.value || undefined,
      products,
    };
    const body =
      data?.deliveries?.value === 'delivery'
        ? deliveryBody
        : pickupAndDineInBody;
    const payment = {
      payment_sys_id: data.paymentType.key,
    };

    setLoading(true);
    orderService
      .create(body)
      .then((response) => {
        dispatch(setCartOrder(response.data));
        createTransaction(response.data.id, payment);
        form.resetFields();
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <Card>
      {loading && (
        <div className='loader'>
          <Spin />
        </div>
      )}
      <div className='card-save'>
        {cartShops?.map((shop, idx) => (
          <div key={shop.uuid + '_' + idx}>
            <div className='all-price'>
              <span className='title'>
                {shop?.translation?.title} {t('shop')}
              </span>
              <span className='counter'>
                {shop?.products?.length}{' '}
                {shop?.products?.length > 1 ? t('products') : t('product')}
              </span>
            </div>
            {shop?.products?.map((item, index) =>
              item?.bonus !== true ? (
                <div
                  className='custom-cart-container'
                  key={item?.id + '_' + index}
                >
                  <Row className='product-row'>
                    <ColumnImage image={getImage(item?.img)} row={item} />
                    <Col span={18} className='product-col'>
                      <div>
                        <span className='product-name'>
                          {item?.translation?.title}
                        </span>
                        <br />
                        <Space wrap className='mt-2'>
                          {item?.stock?.map((el, idy) => {
                            return (
                              <span
                                key={idy + '-' + el.value}
                                className='extras-text rounded pr-2 pl-2'
                              >
                                {el.value}
                              </span>
                            );
                          })}
                        </Space>
                        <br />
                        <Space wrap className='mt-2'>
                          {item?.addons?.map((addon, idk) => {
                            return (
                              <span
                                key={idk + '-' + addon?.quantity}
                                className='extras-text rounded pr-2 pl-2'
                              >
                                {addon?.product?.translation?.title} x{' '}
                                {addon?.quantity}
                              </span>
                            );
                          })}
                        </Space>
                        <div className='product-counter'>
                          <span>
                            {numberToPrice(
                              item?.total_price || item?.price,
                              currency?.symbol,
                              currency?.position,
                            )}
                          </span>

                          <div className='count'>
                            <Button
                              className='button-counter'
                              shape='circle'
                              icon={<MinusOutlined size={14} />}
                              onClick={() => decrement(item)}
                            />
                            <span>
                              {item?.countable_quantity * (item?.interval || 1)}
                              {item?.unit?.translation?.title}
                            </span>
                            <Button
                              className='button-counter'
                              shape='circle'
                              icon={<PlusOutlined size={14} />}
                              onClick={() => increment(item)}
                            />
                            <Button
                              className='button-counter'
                              shape='circle'
                              onClick={() => deleteCard(item)}
                              icon={<DeleteOutlined size={14} />}
                            />
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col span={24}>
                      <Input
                        placeholder={t('note')}
                        className='w-100 mt-2'
                        defaultValue={notes[item.stockID.id]}
                        onBlur={(event) =>
                          dispatch(
                            addOrderNotes({
                              label: item.stockID.id,
                              value: event.target.value || undefined,
                            }),
                          )
                        }
                      />
                    </Col>
                  </Row>
                </div>
              ) : (
                <>
                  <h4 className='mt-2'> {t('Bonus.product')} </h4>
                  <div
                    className='custom-cart-container'
                    key={item.id + '_' + index}
                  >
                    <Row className='product-row'>
                      <ColumnImage image={getImage(item?.img)} row={item} />
                      <Col span={18} className='product-col'>
                        <div>
                          <span className='product-name'>
                            {item?.stockID?.product?.translation?.title}
                          </span>
                          <br />
                          <Space wrap className='mt-2'>
                            {item?.stockID?.stock_extras?.map((el, idj) => {
                              return (
                                <span
                                  key={idj}
                                  className='extras-text rounded pr-2 pl-2'
                                >
                                  {el?.value}
                                </span>
                              );
                            })}
                          </Space>
                          <br />
                          <Space wrap className='mt-2'>
                            {item.addons?.map((addon, idp) => {
                              return (
                                <span
                                  key={idp + '_' + addon?.quantity}
                                  className='extras-text rounded pr-2 pl-2'
                                >
                                  {addon?.countable?.translation?.title} x{' '}
                                  {addon?.quantity}
                                </span>
                              );
                            })}
                          </Space>
                          <div className='product-counter'>
                            <span>
                              {numberToPrice(
                                item?.total_price || item?.price,
                                currency?.symbol,
                                currency?.position,
                              )}
                            </span>

                            <div className='count'>
                              <Button
                                className='button-counter'
                                shape='circle'
                                icon={<MinusOutlined size={14} />}
                                onClick={() => decrement(item)}
                                disabled
                              />
                              <span>
                                {item?.quantity * (item?.interval || 1)}
                                {item?.unit?.translation?.title}
                              </span>
                              <Button
                                className='button-counter'
                                shape='circle'
                                icon={<PlusOutlined size={14} />}
                                onClick={() => increment(item)}
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </>
              ),
            )}

            <div className='d-flex my-3'>
              <Input
                placeholder={t('coupon')}
                className='w-100 mr-2'
                addonAfter={
                  coupons.find((el) => el.shop_id === shop.id)?.verified ? (
                    <CheckOutlined style={{ color: '#18a695' }} />
                  ) : null
                }
                defaultValue={
                  coupons.find((el) => el.shop_id === shop.id)?.coupon
                }
                onBlur={(event) =>
                  dispatch(
                    addCoupon({
                      coupon: event.target.value,
                      user_id: data?.user?.value,
                      shop_id: shop.id,
                      verified: false,
                    }),
                  )
                }
                onChange={(event) => setCouponField(event.target.value)}
              />
              <Button
                disabled={
                  couponField.trim().length === 0 ||
                  couponField.trim().length < 2
                }
                onClick={() => handleCheckCoupon(shop?.products?.[0]?.shop?.id)}
                loading={loadingCoupon === shop.id}
              >
                {t('check.coupon')}
              </Button>
            </div>
          </div>
        ))}

        <Row className='all-price-row'>
          <Col span={24} className='col'>
            <div className='all-price-container'>
              <span>{t('sub.total')}</span>
              <span>
                {numberToPrice(
                  total.product_total,
                  currency?.symbol,
                  currency?.position,
                )}
              </span>
            </div>
            <div className='all-price-container'>
              <span>{t('shop.tax')}</span>
              <span>
                {numberToPrice(
                  total.shop_tax,
                  currency?.symbol,
                  currency?.position,
                )}
              </span>
            </div>
            <div className='all-price-container'>
              <span>{t('delivery.fee')}</span>
              <span>
                {numberToPrice(
                  total.delivery_fee,
                  currency?.symbol,
                  currency?.position,
                )}
              </span>
            </div>
            <div className='all-price-container'>
              <span>{t('service.fee')}</span>
              <span>
                {numberToPrice(
                  total.service_fee,
                  currency?.symbol,
                  currency?.position,
                )}
              </span>
            </div>
            {!!total?.couponPrice && (
              <div className='all-price-container'>
                <span>{t('coupon')}</span>
                <span style={{ color: 'red' }}>
                  -{' '}
                  {numberToPrice(
                    total?.couponPrice,
                    currency?.symbol,
                    currency?.position,
                  )}
                </span>
              </div>
            )}
          </Col>
        </Row>

        <Row className='submit-row'>
          <Col span={14} className='col'>
            <span>{t('total.amount')}</span>
            <span>
              {numberToPrice(
                total.order_total,
                currency?.symbol,
                currency?.position,
              )}
            </span>
          </Col>
          <Col className='col2'>
            <Button
              type='primary'
              onClick={() => handleClick()}
              disabled={!cartShops.length}
              loading={loading}
            >
              {t('place.order')}
            </Button>
          </Col>
        </Row>
      </div>
      {!!orderId && (
        <PreviewInfo orderId={orderId} handleClose={handleCloseInvoice} />
      )}
    </Card>
  );
}
