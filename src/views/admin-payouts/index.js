import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tabs, Tag, Tooltip, Statistic } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { addMenu, disableRefetch, setMenuData } from '../../redux/slices/menu';
import useDidUpdate from '../../helpers/useDidUpdate';
import formatSortType from '../../helpers/formatSortType';
import { useTranslation } from 'react-i18next';
import numberToPrice from '../../helpers/numberToPrice';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import PayoutRequestModal from './payoutActionModal';
import FilterColumns from '../../components/filter-column';
import { useNavigate } from 'react-router-dom';
import { fetchAdminPayouts } from '../../redux/slices/adminPayouts';
import PayoutStatusChangeModal from './payoutStatusChangeModal';
import moment from 'moment/moment';

const { TabPane } = Tabs;

// We only really need 2 logical views: all *pending* requests to be processed, and
// historical payouts (accepted / canceled).  This keeps the UX simple and focused.
const views = [
  {
    key: 'pending',
    label: 'pending', // i18n key
    statusParam: 'pending',
  },
  {
    key: 'history',
    label: 'history',
    // send no status param so backend returns all & we exclude pending locally
    statusParam: undefined,
  },
];

export default function AdminPayouts() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [viewKey, setViewKey] = useState('pending');
  const immutable = activeMenu.data?.viewKey || viewKey;
  const data = activeMenu.data;
  const paramsData = {
    sort: data?.sort,
    column: data?.column,
    perPage: data?.perPage,
    page: data?.page,
    status:
      immutable === 'history'
        ? undefined // show everything; we'll filter pending out below for clarity
        : 'pending',
  };

  const { payoutRequests, meta, loading, params } = useSelector(
    (state) => state.adminPayouts,
    shallowEqual,
  );
  const [modal, setModal] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // Aggregate pending amount for quick glance (client-side)
  const pendingTotal = payoutRequests
    ?.filter((pr) => pr.status === 'pending')
    .reduce((acc, cur) => acc + Number(cur.price || 0), 0);

  const goToUser = (row) => {
    dispatch(
      addMenu({
        url: `/users/user/${row.uuid}`,
        id: 'user_info',
        name: t('user.info'),
      }),
    );
    navigate(`/users/user/${row.uuid}`, { state: { user_id: row.id } });
  };

  const [columns, setColumns] = useState([
    {
      title: t('user'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      is_show: true,
      render: (user) => (
        <div className='text-hover' onClick={() => goToUser(user)}>
          {user?.firstname + ' ' + user?.lastname}
        </div>
      ),
    },
    {
      title: t('price'),
      dataIndex: 'price',
      key: 'price',
      is_show: true,
      render: (price, row) =>
        numberToPrice(price, row?.currency?.symbol, row?.currency?.position),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      is_show: true,
      render: (status) => {
        const colorMap = {
          pending: 'blue',
          accepted: 'green',
          canceled: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{t(status)}</Tag>;
      },
    },
    {
      title: t('cause'),
      dataIndex: 'cause',
      key: 'cause',
      is_show: true,
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (_, row) => moment(row?.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('answer'),
      dataIndex: 'answer',
      key: 'answer',
      is_show: true,
    },
    {
      title: t('actions'),
      dataIndex: 'uuid',
      key: 'uuid',
      is_show: true,
      render: (_, row) => (
        <Space>
          {row.status === 'pending' && (
            <>
              <Tooltip title={t('approve')}>
                <Button
                  type='primary'
                  onClick={() => setSelectedRow({ ...row, desiredStatus: 'accepted' })}
                >
                  {t('pay')}
                </Button>
              </Tooltip>
              <Tooltip title={t('reject')}>
                <Button
                  danger
                  onClick={() => setSelectedRow({ ...row, desiredStatus: 'canceled' })}
                >
                  {t('reject')}
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ]);

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(fetchAdminPayouts(paramsData));
      dispatch(disableRefetch(activeMenu));
    }
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    dispatch(fetchAdminPayouts(paramsData));
  }, [activeMenu.data]);

  function onChangePagination(pagination, filters, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(
      setMenuData({ activeMenu, data: { perPage, page, column, sort } }),
    );
  }

  const handleFilter = (items) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, ...items },
      }),
    );
  };

  return (
    <Card
      title={t('payout.requests')}
      extra={
        <Space>
          <Button onClick={() => setModal(true)} type='primary'>
            {t('create.payout')}
          </Button>
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      {/* Quick overview of pending liability */}
      {immutable === 'pending' && (
        <Statistic
          title={t('total.pending')}
          value={numberToPrice(pendingTotal)}
          className='mb-4'
        />
      )}

      <Tabs
        className='mt-3'
        activeKey={immutable}
        onChange={(key) => {
          handleFilter({ viewKey: key, page: 1 });
          setViewKey(key);
        }}
        type='card'
      >
        {views.map((v) => (
          <TabPane tab={t(v.label)} key={v.key} />
        ))}
      </Tabs>
      <Table
        scroll={{ x: true }}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={payoutRequests}
        pagination={{
          pageSize: params.perPage,
          page: params.page,
          total: meta.total,
          defaultCurrent: params.page,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
        loading={loading}
      />
      {modal && (
        <PayoutRequestModal data={modal} handleCancel={() => setModal(null)} />
      )}
      {selectedRow && (
        <PayoutStatusChangeModal
          data={selectedRow}
          statuses={views.map((v) => v.key)}
          handleCancel={() => setSelectedRow(null)}
        />
      )}
    </Card>
  );
}
