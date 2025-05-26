import React, { useEffect, useState } from 'react';
import { Card, Table, Space, Button, Tag } from 'antd';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../../redux/slices/menu';
import { useTranslation } from 'react-i18next';
import formatSortType from '../../../helpers/formatSortType';
import useDidUpdate from '../../../helpers/useDidUpdate';
import { fetchRepayments } from '../../../redux/slices/loans';
import FilterColumns from '../../../components/filter-column';
import SearchInput from '../../../components/search-input';
import numberToPrice from '../../../helpers/numberToPrice';
import moment from 'moment';
import RepaymentModal from './repayment-modal';

export default function LoanRepayments() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { repayments, loading, meta, params } = useSelector((state) => state.loans, shallowEqual);
  const { defaultCurrency } = useSelector((state) => state.currency, shallowEqual);

  const [columns, setColumns] = useState([
    { title: t('id'), dataIndex: 'id', key: 'id', sorter: true, is_show: true },
    { title: t('loan_id'), dataIndex: 'loan_id', key: 'loan_id', is_show: true },
    { title: t('seller'), dataIndex: 'user', key: 'user', is_show: true, render: (u)=> `${u?.firstname} ${u?.lastname}`},
    { title: t('amount'), dataIndex: 'amount', key: 'amount', is_show: true, render:(a)=>numberToPrice(a, defaultCurrency?.symbol, defaultCurrency?.position)},
    { title: t('payment_method'), dataIndex: 'payment_method', key: 'payment_method', is_show:true, render:(m)=><Tag>{m}</Tag>},
    { title: t('created_at'), dataIndex:'created_at', key:'created_at', is_show:true, render:(d)=>moment(d).format('YYYY-MM-DD')},
  ]);

  const [modal, setModal] = useState(false);

  function onChangePagination(pagination, filters, sorter){
    const { pageSize:perPage, current:page } = pagination;
    const { field:column, order } = sorter;
    const sort = formatSortType(order);
    dispatch(setMenuData({ activeMenu, data:{ perPage, page, column, sort }}));
  }

  useEffect(()=>{
    if(activeMenu.refetch){
      dispatch(fetchRepayments());
      dispatch(disableRefetch(activeMenu));
    }
  },[activeMenu.refetch]);

  useDidUpdate(()=>{
    const d = activeMenu.data;
    const p = { sort:d?.sort, column:d?.column, perPage:d?.perPage, page:d?.page, search:d?.search };
    dispatch(fetchRepayments(p));
  },[activeMenu.data]);

  const handleFilter=(value,name)=>{
    const d = activeMenu.data;
    dispatch(setMenuData({ activeMenu, data:{ ...d, [name]:value }}));
  };

  return (
    <Card title={t('loan_repayments')} extra={<Space wrap>
      <Button type='primary' onClick={()=>setModal(true)}>{t('add')}</Button>
      <SearchInput placeholder={t('search')} handleChange={(val)=>handleFilter(val,'search')} defaultValue={activeMenu.data?.search} resetSearch={!activeMenu.data?.search}/>
      <FilterColumns columns={columns} setColumns={setColumns} />
    </Space>}>
      <Table scroll={{x:true}} columns={columns.filter(i=>i.is_show)} dataSource={repayments} loading={loading} pagination={{ pageSize: params.perPage, page: params.page, total: meta?.total }} rowKey={(r)=>r.id} onChange={onChangePagination} />
      {modal && <RepaymentModal visible={modal} onCancel={()=>setModal(false)} onSuccess={()=>dispatch(fetchRepayments())} />}
    </Card>
  );
} 