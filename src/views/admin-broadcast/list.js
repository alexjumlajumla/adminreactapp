import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Popconfirm, message } from 'antd';
import request from '../../services/request';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export default function BroadcastList() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    request
      .get('dashboard/admin/broadcasts')
      .then((res) => setData(res.data?.data || []))
      .catch(() => message.error(t('something.went.wrong')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resend = (id) => {
    request
      .post(`dashboard/admin/broadcasts/${id}/resend`)
      .then(() => {
        message.success(t('sent.successfully'));
        fetchData();
      })
      .catch(() => message.error(t('something.went.wrong')));
  };

  const columns = [
    {
      title: t('title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('channels'),
      dataIndex: 'channels',
      key: 'channels',
      render: (val) => val.join(', '),
    },
    {
      title: t('groups'),
      dataIndex: 'groups',
      key: 'groups',
      render: (val) => val.join(', '),
    },
    {
      title: t('created.at'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm title={t('resend.question')} onConfirm={() => resend(record.id)}>
            <Button size='small'>{t('resend')}</Button>
          </Popconfirm>
          {/* Future: edit support */}
        </Space>
      ),
    },
  ];

  return (
    <Card title={t('broadcast.history')}>
      <Table rowKey='id' loading={loading} columns={columns} dataSource={data} />
    </Card>
  );
} 