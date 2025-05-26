import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message } from 'antd';
import request from '../../services/request';
import { useTranslation } from 'react-i18next';

export default function OptimizationAnalytics() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    request
      .get('dashboard/admin/trips/optimization-logs')
      .then((res) => {
        setLogs(res.data);
      })
      .catch(() => message.error(t('something.went.wrong')))
      .finally(() => setLoading(false));
  };

  const columns = [
    { title: t('time.taken'), dataIndex: 'time_taken', key: 'time_taken' },
    { title: t('strategy.used'), dataIndex: 'strategy', key: 'strategy' },
    { title: t('confidence.score'), dataIndex: 'confidence_score', key: 'confidence_score' },
    { title: t('previous.route'), dataIndex: 'previous_route', key: 'previous_route' },
    { title: t('optimized.route'), dataIndex: 'optimized_route', key: 'optimized_route' },
  ];

  const handleDownload = (format) => {
    // Implement download logic
    console.log(`Downloading logs as ${format}`);
  };

  return (
    <Card title={t('optimization.analytics')} loading={loading}>
      <Button onClick={() => handleDownload('csv')}>{t('download.csv')}</Button>
      <Button onClick={() => handleDownload('pdf')}>{t('download.pdf')}</Button>
      <Table rowKey='id' columns={columns} dataSource={logs} pagination={false} style={{ marginTop: 16 }} />
    </Card>
  );
} 