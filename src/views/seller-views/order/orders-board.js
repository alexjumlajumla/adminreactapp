import React, { useEffect, useState, useContext } from 'react';
import { Button, Space, Card, DatePicker, Modal } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ClearOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setMenuData } from 'redux/slices/menu';
import { useTranslation } from 'react-i18next';
import useDidUpdate from 'helpers/useDidUpdate';
import SearchInput from 'components/search-input';
import { DebounceSelect } from 'components/search';
import userService from 'services/seller/user';
import { fetchRestOrderStatus } from 'redux/slices/orderStatus';
import { Context } from 'context/context';
import { toast } from 'react-toastify';
import orderService from 'services/seller/order';
import {
  clearItems,
  fetchAcceptedOrders,
  fetchCanceledOrders,
  fetchDeliveredOrders,
  fetchNewOrders,
  fetchOnAWayOrders,
  fetchReadyOrders,
  fetchCookingOrders,
} from 'redux/slices/sellerOrders';
import { batch } from 'react-redux';
import { clearOrder } from 'redux/slices/order';
import CustomModal from 'components/modal';
import moment from 'moment';
import { fetchSellerOrders } from 'redux/slices/orders';
import OrderDeliveryman from './orderDeliveryman';
import Incorporate from './dnd/Incorporate';
import OrderTypeSwitcher from './order-type-switcher';
import ShowLocationsMap from './show-locations.map';
import DownloadModal from './downloadModal';
import TransactionStatusModal from './transactionStatusModal';

const { RangePicker } = DatePicker;

export default function SellerOrdersBoard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [id, setId] = useState(null);
  const { setIsModalVisible } = useContext(Context);
  const [text, setText] = useState(null);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [locationsMap, setLocationsMap] = useState(null);
  const [dowloadModal, setDowloadModal] = useState(null);
  const [orderDeliveryDetails, setOrderDeliveryDetails] = useState(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(null);
  const [type, setType] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const urlParams = useParams();
  const orderType = urlParams?.type;

  const data = activeMenu?.data;

  const paramsData = {
    search: data?.search ? data.search : undefined,
    perPage: data?.perPage || 5,
    page: data?.page || 1,
    user_id: data?.client_id,
    date_from: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
    date_to: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    delivery_type: orderType,
  };

  const goToShow = (row) => {
    dispatch(
      addMenu({
        url: `seller/order/details/${row.id}`,
        id: 'order_details',
        name: t('order.details'),
      }),
    );
    navigate(`/seller/order/details/${row.id}`);
  };

  const orderDelete = () => {
    setLoadingBtn(true);
    const params = {
      ...Object.assign(
        {},
        ...id.map((item, index) => ({
          [`ids[${index}]`]: item,
        })),
      ),
    };
    orderService
      .delete(params)
      .then(() => {
        dispatch(clearItems());
        toast.success(t('successfully.deleted'));
        setIsModalVisible(false);
        fetchOrderAllItem({ status: type });
        setText(null);
      })
      .finally(() => {
        setId(null);
        setLoadingBtn(false);
      });
  };

  useDidUpdate(() => {
    // dispatch(handleSearch(paramsData));
    dispatch(clearItems());
    fetchOrderAllItem();
  }, [data, dateRange]);

  useEffect(() => {
    if (activeMenu?.refetch) {
      dispatch(fetchSellerOrders(paramsData));
      dispatch(fetchRestOrderStatus({}));
      dispatch(disableRefetch(activeMenu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu?.refetch]);

  const handleFilter = (item, name) => {
    batch(() => {
      dispatch(clearItems());
      dispatch(
        setMenuData({
          activeMenu,
          data: { ...data, [name]: item },
        }),
      );
    });
  };

  async function getUsers(search) {
    const params = {
      search,
      perPage: 10,
    };
    return userService.getAll(params).then(({ data }) => {
      return data.map((item) => ({
        label: `${item.firstname} ${item.lastname || ''}`,
        value: item.id,
      }));
    });
  }

  const fetchOrdersCase = (params) => {
    const paramsWithType = {
      ...params,
      delivery_type: orderType,
      delivery_date_from:
        type === 'scheduled'
          ? moment().add(1, 'day').format('YYYY-MM-DD')
          : undefined,

      search: data?.search ? data.search : undefined,
      user_id: data?.client_id,
      status: params?.status,
      shop_id:
        activeMenu.data?.shop_id !== null ? activeMenu.data?.shop_id : null,
      date_from: dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
      date_to: dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    };
    switch (params?.status) {
      case 'new':
        dispatch(fetchNewOrders(paramsWithType));
        break;
      case 'accepted':
        dispatch(fetchAcceptedOrders(paramsWithType));
        break;
      case 'ready':
        dispatch(fetchReadyOrders(paramsWithType));
        break;
      case 'on_a_way':
        dispatch(fetchOnAWayOrders(paramsWithType));
        break;
      case 'delivered':
        dispatch(fetchDeliveredOrders(paramsWithType));
        break;
      case 'canceled':
        dispatch(fetchCanceledOrders(paramsWithType));
        break;
      case 'cooking':
        dispatch(fetchCookingOrders(paramsWithType));
        break;
      default:
        console.log(`Sorry, we are out of`);
    }
  };

  const fetchOrderAllItem = () => {
    dispatch(clearItems());
    fetchOrdersCase({ status: 'new' });
    fetchOrdersCase({ status: 'accepted' });
    fetchOrdersCase({ status: 'ready' });
    fetchOrdersCase({ status: 'on_a_way' });
    fetchOrdersCase({ status: 'delivered' });
    fetchOrdersCase({ status: 'canceled' });
    fetchOrdersCase({ status: 'cooking' });
  };

  const handleClear = () => {
    batch(() => {
      dispatch(clearItems());
      dispatch(
        setMenuData({
          activeMenu,
          data: null,
        }),
      );
    });
    fetchOrderAllItem();
  };

  const handleCloseModal = () => {
    setOrderDeliveryDetails(null);
    setLocationsMap(null);
    setDowloadModal(null);
  };
  const goToAddOrder = () => {
    dispatch(clearOrder());
    dispatch(
      addMenu({
        id: 'pos.system',
        url: 'seller/pos-system',
        name: t('add.order'),
      }),
    );
    navigate('/seller/pos-system', { state: { delivery_type: orderType } });
  };

  return (
    <>
      <Space className='justify-content-end w-100 mb-3'>
        <OrderTypeSwitcher listType='seller/orders-board' />
        <Button
          type='primary'
          icon={<PlusCircleOutlined />}
          onClick={goToAddOrder}
          style={{ width: '100%' }}
        >
          {t('add.order')}
        </Button>
      </Space>
      <Card>
        <Space wrap>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFilter(search, 'search')}
            defaultValue={activeMenu.data?.search}
            resetSearch={!data?.search}
          />
          <DebounceSelect
            placeholder={t('select.client')}
            fetchOptions={getUsers}
            onSelect={(user) => handleFilter(user.value, 'client_id')}
            onDeselect={() => handleFilter(null, 'client_id')}
            style={{ minWidth: 200 }}
            onClear={handleClear}
            value={data?.client_id}
          />
          <RangePicker
            defaultValue={dateRange}
            onChange={(values) => {
              handleFilter(JSON.stringify(values), 'data_time');
              setDateRange(values);
            }}
            allowClear={true}
            style={{ width: '100%' }}
            onClear={() => {
              dispatch(clearItems());
              setDateRange(null);
            }}
          />
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            {t('clear')}
          </Button>
        </Space>
      </Card>
      <Incorporate
        goToShow={goToShow}
        fetchOrderAllItem={fetchOrderAllItem}
        fetchOrders={fetchOrdersCase}
        setLocationsMap={setLocationsMap}
        setId={setId}
        setIsModalVisible={setIsModalVisible}
        setText={setText}
        setDowloadModal={setDowloadModal}
        type={type}
        setType={setType}
        orderType={orderType}
        setIsTransactionModalOpen={setIsTransactionModalOpen}
      />
      <CustomModal
        click={orderDelete}
        text={text ? t('delete') : t('all.delete')}
        loading={loadingBtn}
        setText={setId}
        setActive={setId}
      />
      {orderDeliveryDetails && (
        <OrderDeliveryman
          orderDetails={orderDeliveryDetails}
          handleCancel={handleCloseModal}
        />
      )}
      {!!isTransactionModalOpen && (
        <Modal
          visible={!!isTransactionModalOpen}
          footer={false}
          onCancel={() => setIsTransactionModalOpen(null)}
        >
          <TransactionStatusModal
            data={isTransactionModalOpen}
            onCancel={() => setIsTransactionModalOpen(null)}
            refreshOrders={fetchOrderAllItem}
          />
        </Modal>
      )}
      {locationsMap && (
        <ShowLocationsMap id={locationsMap} handleCancel={handleCloseModal} />
      )}
      {dowloadModal && (
        <DownloadModal id={dowloadModal} handleCancel={handleCloseModal} />
      )}
    </>
  );
}
