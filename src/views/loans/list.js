import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Table, Tag } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../redux/slices/menu';
import { useTranslation } from 'react-i18next';
import formatSortType from '../../helpers/formatSortType';
import useDidUpdate from '../../helpers/useDidUpdate';
import { fetchLoans } from '../../redux/slices/loans';
import SearchInput from '../../components/search-input';
import FilterColumns from '../../components/filter-column';
import { PlusOutlined } from '@ant-design/icons';
import LoanModal from './loan-modal';
import moment from 'moment';
import numberToPrice from '../../helpers/numberToPrice';

export default function LoansList() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { loans, loading, meta, params } = useSelector(
    (state) => state.loans,
    shallowEqual,
  );
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
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
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      is_show: true,
      render: (user) => `${user?.firstname} ${user?.lastname}`,
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      is_show: true,
      render: (amount) => numberToPrice(amount, defaultCurrency?.symbol),
    },
    {
      title: t('interest_rate'),
      dataIndex: 'interest_rate',
      key: 'interest_rate',
      is_show: true,
      render: (rate) => `${rate}%`,
    },
    {
      title: t('repayment_amount'),
      dataIndex: 'repayment_amount',
      key: 'repayment_amount',
      is_show: true,
      render: (amount) => numberToPrice(amount, defaultCurrency?.symbol),
    },
    {
      title: t('disbursed_by'),
      dataIndex: 'disbursed_by_user',
      key: 'disbursed_by_user',
      is_show: true,
      render: (user) => `${user?.firstname} ${user?.lastname}`,
    },
    {
      title: t('disbursed_at'),
      dataIndex: 'disbursed_at',
      key: 'disbursed_at',
      is_show: true,
      render: (date) => moment(date).format('DD-MM-YYYY HH:mm:ss'),
    },
    {
      title: t('due_date'),
      dataIndex: 'due_date',
      key: 'due_date',
      is_show: true,
      render: (date) => moment(date).format('DD-MM-YYYY'),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      is_show: true,
      render: (status) => (
        <Tag color={
          status === 'active' ? 'blue' : 
          status === 'repaid' ? 'green' : 
          'red'
        }>
          {status}
        </Tag>
      ),
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
      dispatch(fetchLoans());
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
    dispatch(fetchLoans(paramsData));
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
      title={t('loans')}
      extra={
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            {t('add.loan')}
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
        dataSource={loans}
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
        <LoanModal
          visible={isModalOpen}
          handleCancel={() => setIsModalOpen(false)}
        />
      )}
    </Card>
  );
} 