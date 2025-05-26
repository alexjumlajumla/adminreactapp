import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../redux/slices/menu';
import { useTranslation } from 'react-i18next';
import formatSortType from '../../helpers/formatSortType';
import useDidUpdate from '../../helpers/useDidUpdate';
import { fetchVfdReceipts } from '../../redux/slices/vfd';
import SearchInput from '../../components/search-input';
import FilterColumns from '../../components/filter-column';
import { PlusOutlined } from '@ant-design/icons';
import VfdReceiptModal from './vfd-receipt-modal';
import moment from 'moment';

export default function VfdReceipts() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { receipts, loading, meta, params } = useSelector(
    (state) => state.vfd,
    shallowEqual,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      is_show: true,
    },
    {
      title: t('receipt_number'),
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      is_show: true,
    },
    {
      title: t('type'),
      dataIndex: 'receipt_type',
      key: 'receipt_type',
      is_show: true,
      render: (type) => (
        <Tag color={type === 'delivery' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      is_show: true,
      render: (amount) => `TZS ${amount}`,
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      is_show: true,
      render: (status) => (
        <Tag color={status === 'pending' ? 'orange' : status === 'success' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: t('created_at'),
      dataIndex: 'created_at',
      key: 'created_at',
      is_show: true,
      render: (date) => moment(date).format('DD-MM-YYYY HH:mm:ss'),
    },
  ]);

  function onChangePagination(pagination, filters, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(
      setMenuData({ activeMenu, data: { perPage, page, column, sort } }),
    );
  }

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(fetchVfdReceipts());
      dispatch(disableRefetch(activeMenu));
    }
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
    dispatch(fetchVfdReceipts(paramsData));
  }, [activeMenu.data]);

  const handleFilter = (item, name) => {
    const data = activeMenu.data;
    dispatch(
      setMenuData({
        activeMenu,
        data: { ...data, [name]: item },
      }),
    );
  };

  return (
    <Card
      title={t('vfd_receipts')}
      extra={
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            {t('generate_receipt')}
          </Button>
          <SearchInput
            placeholder={t('search')}
            handleChange={(search) => handleFilter(search, 'search')}
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
        dataSource={receipts}
        loading={loading}
        pagination={{
          pageSize: params.perPage,
          page: params.page,
          total: meta.total,
          defaultCurrent: params.page,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
      />
      {isModalOpen && (
        <VfdReceiptModal
          visible={isModalOpen}
          handleCancel={() => setIsModalOpen(false)}
        />
      )}
    </Card>
  );
} 