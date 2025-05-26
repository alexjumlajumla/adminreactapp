import React from 'react';
import {
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  CarOutlined,
  DollarOutlined,
  PayCircleOutlined,
  BorderlessTableOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Avatar, Card, List, Skeleton, Space } from 'antd';
import numberToPrice from '../helpers/numberToPrice';
import { BiMap } from 'react-icons/bi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import useDemo from '../helpers/useDemo';

const { Meta } = Card;

const OrderCard = ({
  data: item,
  goToShow,
  loading,
  setLocationsMap,
  setId,
  setIsModalVisible,
  setText,
  setDowloadModal,
  setTabType,
  setIsTransactionModalOpen,
}) => {
  const { t } = useTranslation();
  const lastTransaction = item.transactions?.at(-1) || {};
  const data = [
    {
      title: 'Client',
      icon: <UserOutlined />,
      data: item?.user
        ? `${item.user?.firstname || '-'} ${item.user?.lastname || '-'}`
        : t('deleted.user'),
    },
    {
      title: 'Deliveryman',
      icon: <CarOutlined />,
      data: `${item.deliveryman?.firstname || '-'} ${
        item.deliveryman?.lastname || '-'
      }`,
    },
    {
      title: 'Amount',
      icon: <DollarOutlined />,
      data: numberToPrice(
        item?.total_price,
        item.currency?.symbol,
        item?.currency?.position,
      ),
    },
    {
      title: 'Last Payment type',
      icon: <PayCircleOutlined />,
      data: lastTransaction?.payment_system?.tag || '-',
    },
    {
      title: 'Last payment status',
      icon: <BorderlessTableOutlined />,
      data: lastTransaction?.status ? (
        <div
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            setIsTransactionModalOpen(lastTransaction);
          }}
        >
          {lastTransaction?.status}{' '}
          <EditOutlined disabled={item?.deleted_at} />
        </div>
      ) : (
        '-'
      ),
    },
    {
      title: 'Delivery date',
      icon: <FieldTimeOutlined />,
      data: moment(item?.delivery_date).format('YYYY-MM-DD') || '-',
    },
    {
      title: 'Created at',
      icon: <FieldTimeOutlined />,
      data: moment(item?.created_at).format('YYYY-MM-DD') || '-',
    },
  ];
  const { isDemo } = useDemo();
  const actions = [
    <BiMap
      size={20}
      onClick={(e) => {
        e.stopPropagation();
        setLocationsMap(item.id);
      }}
    />,
    <DeleteOutlined
      onClick={(e) => {
        if (isDemo) {
          toast.warning(t('cannot.work.demo'));
          return;
        }
        e.stopPropagation();
        setId([item.id]);
        setIsModalVisible(true);
        setText(true);
        setTabType(item.status);
      }}
    />,
    <DownloadOutlined
      onClick={(e) => {
        e.stopPropagation();
        setDowloadModal(item.id);
      }}
    />,
    <EyeOutlined
      onClick={(e) => {
        e.stopPropagation();
        goToShow(item);
      }}
    />,
  ];

  return (
    <Card actions={actions} className='order-card'>
      <Skeleton loading={loading} avatar active>
        <Meta
          avatar={<Avatar src={item?.shop?.logo_img} />}
          description={`#${item.id}`}
          title={item?.shop?.translation?.title}
        />
        <List
          itemLayout='horizontal'
          dataSource={data}
          renderItem={(item, key) => {
            return (
              <List.Item key={key}>
                <Space>
                  {item?.icon}
                  <span>
                    {`${item?.title}:`}
                    {item?.data}
                  </span>
                </Space>
              </List.Item>
            );
          }}
        />
      </Skeleton>
    </Card>
  );
};

export default OrderCard;
