import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, Button, Statistic, Row, Col } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../../redux/slices/menu';
import { useTranslation } from 'react-i18next';
import formatSortType from '../../../helpers/formatSortType';
import useDidUpdate from '../../../helpers/useDidUpdate';
import { fetchSellerLoans } from '../../../redux/slices/sellerLoans';
import SearchInput from '../../../components/search-input';
import FilterColumns from '../../../components/filter-column';
import numberToPrice from '../../../helpers/numberToPrice';
import moment from 'moment';
import RepaymentModal from './repayment-modal';
import loanSellerService from '../../../services/loanSeller';

export default function SellerLoans() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { defaultCurrency } = useSelector((state) => state.currency, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { loans, loading, meta, params } = useSelector((state) => state.sellerLoans, shallowEqual);

  const [columns, setColumns] = useState([
    { title: t('id'), dataIndex: 'id', key: 'id', sorter: true, is_show: true },
    { title: t('amount'), dataIndex: 'amount', key: 'amount', is_show: true, render: (a) => numberToPrice(a, defaultCurrency?.symbol, defaultCurrency?.position) },
    { title: t('repayment_amount'), dataIndex: 'repayment_amount', key: 'repayment_amount', is_show: true, render: (a) => numberToPrice(a, defaultCurrency?.symbol, defaultCurrency?.position) },
    { title: t('remaining_amount'), dataIndex: 'remaining_amount', key: 'remaining_amount', is_show: true, render:(a)=>numberToPrice(a, defaultCurrency?.symbol, defaultCurrency?.position)},
    { title: t('status'), dataIndex: 'status', key: 'status', is_show: true, render: (status) => <Tag color={status==='active'?'gold':status==='repaid'?'green':'red'}>{status}</Tag> },
    { title: t('disbursed_at'), dataIndex: 'disbursed_at', key: 'disbursed_at', is_show: true, render: (d)=> moment(d).format('YYYY-MM-DD') },
  ]);

  const [analytics, setAnalytics] = useState(null);
  const [repayModal, setRepayModal] = useState(false);

  const loadAnalytics = () => {
    loanSellerService.getStatistics().then(setAnalytics);
  };

  function onChangePagination(pagination, filters, sorter){
    const { pageSize:perPage, current:page } = pagination;
    const { field:column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(setMenuData({ activeMenu, data:{ perPage, page, column, sort }}));
  }

  useEffect(()=>{ loadAnalytics(); },[]);

  useEffect(()=>{
    if(activeMenu.refetch){
      dispatch(fetchSellerLoans());
      dispatch(disableRefetch(activeMenu));
      loadAnalytics();
    }
  },[activeMenu.refetch]);

  useDidUpdate(()=>{
    const d = activeMenu.data;
    const p = { sort:d?.sort, column:d?.column, perPage:d?.perPage, page:d?.page, search:d?.search };
    dispatch(fetchSellerLoans(p));
  },[activeMenu.data]);

  const handleFilter=(value,name)=>{
    const d = activeMenu.data;
    dispatch(setMenuData({ activeMenu, data:{ ...d, [name]:value }}));
  };

  return (
    <Card title={t('my_loans')} extra={<Space wrap>
      <Button type='primary' onClick={()=>setRepayModal(true)}>{t('repay_loan')}</Button>
      <SearchInput placeholder={t('search')} handleChange={(val)=>handleFilter(val,'search')} defaultValue={activeMenu.data?.search} resetSearch={!activeMenu.data?.search}/>
      <FilterColumns columns={columns} setColumns={setColumns} />
    </Space>}>
      <Table scroll={{x:true}} columns={columns.filter(i=>i.is_show)} dataSource={loans} loading={loading} pagination={{ pageSize: params.perPage, page: params.page, total: meta?.total }} rowKey={(r)=>r.id} onChange={onChangePagination} />
      {repayModal && <RepaymentModal visible={repayModal} onCancel={()=>setRepayModal(false)} onSuccess={()=>{
        dispatch(fetchSellerLoans());
        loadAnalytics();
      }}/>} 
      {analytics && (
        <Row gutter={16} className='mt-4'>
          <Col span={8}><Statistic title={t('total_loans')} value={analytics.total_loans} /></Col>
          <Col span={8}><Statistic title={t('active_loans')} value={analytics.active_loans} /></Col>
          <Col span={8}><Statistic title={t('repaid_loans')} value={analytics.repaid_loans} /></Col>
        </Row>
      )}
    </Card>
  );
} 