import React, { useEffect, useState } from 'react';
import { Card, Space, Table, Tag, Button } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../redux/slices/menu';
import { useTranslation } from 'react-i18next';
import formatSortType from '../../helpers/formatSortType';
import useDidUpdate from '../../helpers/useDidUpdate';
import { fetchWalletHistories } from '../../redux/slices/walletAdmin';
import SearchInput from '../../components/search-input';
import FilterColumns from '../../components/filter-column';
import numberToPrice from '../../helpers/numberToPrice';
import moment from 'moment';
import WalletTopUpModal from './topup-modal';

export default function WalletHistories() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { histories, loading, meta, params } = useSelector(
    (state) => state.walletAdmin,
    shallowEqual,
  );
  const { defaultCurrency } = useSelector((state) => state.currency, shallowEqual);

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      is_show: true,
    },
    {
      title: t('created.by'),
      dataIndex: 'author',
      key: 'author',
      is_show: true,
      render: (author) => (
        <div>
          {author?.firstname} {author?.lastname || ''}
        </div>
      ),
    },
    {
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      is_show: true,
      render: (user) => (
        <div>
          {user?.firstname} {user?.lastname || ''}
        </div>
      ),
    },
    {
      title: t('type'),
      dataIndex: 'type',
      key: 'type',
      is_show: true,
      render: (type) => <Tag color='blue'>{type}</Tag>,
    },
    {
      title: t('price'),
      dataIndex: 'price',
      key: 'price',
      is_show: true,
      render: (price) => numberToPrice(price, defaultCurrency?.symbol, defaultCurrency?.position),
    },
    {
      title: t('note'),
      dataIndex: 'note',
      key: 'note',
      is_show: true,
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      is_show: true,
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
  ]);

  const [topUpVisible, setTopUpVisible] = useState(false);

  function onChangePagination(pagination, filters, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(setMenuData({ activeMenu, data: { perPage, page, column, sort } }));
  }

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(fetchWalletHistories());
      dispatch(disableRefetch(activeMenu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  useDidUpdate(() => {
    const data = activeMenu.data;
    const paramsData = {
      sort: data?.sort,
      column: data?.column,
      perPage: data?.perPage,
      page: data?.page,
      search: data?.search,
    };
    dispatch(fetchWalletHistories(paramsData));
  }, [activeMenu.data]);

  const handleFilter = (value, name) => {
    const data = activeMenu.data;
    dispatch(setMenuData({ activeMenu, data: { ...data, [name]: value } }));
  };

  return (
    <Card
      title={t('wallet_histories')}
      extra={
        <Space wrap>
          <Button type='primary' onClick={() => setTopUpVisible(true)}>{t('top_up_wallet')}</Button>
          <SearchInput
            placeholder={t('search')}
            handleChange={(val) => handleFilter(val, 'search')}
            defaultValue={activeMenu.data?.search}
            resetSearch={!activeMenu.data?.search}
          />
          <FilterColumns columns={columns} setColumns={setColumns} />
        </Space>
      }
    >
      <Table
        scroll={{ x: true }}
        columns={columns?.filter((item) => item.is_show)}
        dataSource={histories}
        loading={loading}
        pagination={{
          pageSize: params.perPage,
          page: params.page,
          total: meta?.total,
          defaultCurrent: params.page,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
      />
      {topUpVisible && (
        <WalletTopUpModal
          visible={topUpVisible}
          onCancel={() => setTopUpVisible(false)}
          onSuccess={() => dispatch(fetchWalletHistories())}
        />
      )}
    </Card>
  );
}
