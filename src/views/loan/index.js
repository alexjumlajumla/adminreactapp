import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Button, Statistic, Row, Col } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../redux/slices/menu';
import { useTranslation } from 'react-i18next';
import formatSortType from '../../helpers/formatSortType';
import useDidUpdate from '../../helpers/useDidUpdate';
import { fetchLoans } from '../../redux/slices/loans';
import SearchInput from '../../components/search-input';
import FilterColumns from '../../components/filter-column';
import numberToPrice from '../../helpers/numberToPrice';
import moment from 'moment';
import LoanDisbursementModal from './disbursement-modal';
import loanService from '../../services/loan';

export default function Loans() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { defaultCurrency } = useSelector((state) => state.currency, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { loans, loading, meta, params } = useSelector((state) => state.loans, shallowEqual);

  const [columns, setColumns] = useState([
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      is_show: true,
    },
    {
      title: t('vendor'),
      dataIndex: 'vendor',
      key: 'vendor',
      is_show: true,
      render: (vendor) => (
        <div>
          {vendor?.firstname} {vendor?.lastname || ''}
        </div>
      ),
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      is_show: true,
      render: (amount) => numberToPrice(amount, defaultCurrency?.symbol, defaultCurrency?.position),
    },
    {
      title: t('repayment_amount'),
      dataIndex: 'repayment_amount',
      key: 'repayment_amount',
      is_show: true,
      render: (amount) => numberToPrice(amount, defaultCurrency?.symbol, defaultCurrency?.position),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      is_show: true,
      render: (status) => {
        const color = status === 'active' ? 'gold' : status === 'repaid' ? 'green' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: t('disbursed_at'),
      dataIndex: 'disbursed_at',
      key: 'disbursed_at',
      is_show: true,
      render: (date) => moment(date).format('YYYY-MM-DD'),
    },
  ]);

  const [analytics, setAnalytics] = useState(null);
  const [disModal, setDisModal] = useState(false);

  function onChangePagination(pagination, filters, sorter) {
    const { pageSize: perPage, current: page } = pagination;
    const { field: column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(setMenuData({ activeMenu, data: { perPage, page, column, sort } }));
  }

  const loadAnalytics = () => {
    loanService.getStatistics().then((res) => setAnalytics(res));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (activeMenu.refetch) {
      dispatch(fetchLoans());
      dispatch(disableRefetch(activeMenu));
      loadAnalytics();
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
    dispatch(fetchLoans(paramsData));
  }, [activeMenu.data]);

  const handleFilter = (value, name) => {
    const data = activeMenu.data;
    dispatch(setMenuData({ activeMenu, data: { ...data, [name]: value } }));
  };

  return (
    <Card
      title={t('loans')}
      extra={
        <Space wrap>
          <Button type='primary' onClick={() => setDisModal(true)}>{t('disburse_loan')}</Button>
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
        dataSource={loans}
        loading={loading}
        pagination={{
          pageSize: params.perPage,
          page: params.page,
          total: meta?.total || 0,
          defaultCurrent: params.page,
        }}
        rowKey={(record) => record.id}
        onChange={onChangePagination}
      />
      {disModal && (
        <LoanDisbursementModal
          visible={disModal}
          onCancel={() => setDisModal(false)}
          onSuccess={() => {
            dispatch(setMenuData({ activeMenu, data: { ...activeMenu.data, page: 1 } }));
            dispatch(fetchLoans());
            loadAnalytics();
          }}
        />
      )}
      {analytics && (
        <Row gutter={16} className='mt-4'>
          <Col span={6}><Statistic title={t('total_loans')} value={analytics.total_loans} /></Col>
          <Col span={6}><Statistic title={t('active_loans')} value={analytics.active_loans} /></Col>
          <Col span={6}><Statistic title={t('repaid_loans')} value={analytics.repaid_loans} /></Col>
          <Col span={6}><Statistic title={t('defaulted_loans')} value={analytics.defaulted_loans} /></Col>
        </Row>
      )}
    </Card>
  );
} 