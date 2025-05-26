import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, DatePicker, message, Tag, Select } from 'antd';
import request from '../../services/request';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Link, useNavigate } from 'react-router-dom';
import OptimizationAnalytics from './analytics';
import SettingsPanel from './settings';

export default function TripsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ status: '', date: null, optimized: '' });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    request
      .get('dashboard/admin/trips')
      .then((res) => {
        const list = res.data?.data?.data || res.data?.data || [];
        setData(list);
      })
      .catch(() => message.error(t('something.went.wrong')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    form
      .validateFields()
      .then((values) => {
        // prepare payload
        const payload = {
          name: values.name,
          start_address: values.start_address,
          start_lat: values.start_lat,
          start_lng: values.start_lng,
          scheduled_at: values.scheduled_at?.toISOString(),
          locations: values.locations?.map((loc) => ({
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng,
          })) || [],
        };
        request
          .post('dashboard/admin/trips', payload)
          .then(() => {
            message.success(t('created.successfully'));
            setCreateVisible(false);
            form.resetFields();
            fetchData();
          })
          .catch(() => message.error(t('something.went.wrong')));
      })
      .catch(() => {});
  };

  const handleOptimize = (trip) => {
    setLoading(true);
    request
      .post(`dashboard/admin/trips/${trip.id}/optimize`)
      .then(() => {
        message.success(t('optimized.successfully'));
        fetchData();
      })
      .catch(() => message.error(t('something.went.wrong')))
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredData = data.filter((trip) => {
    const matchesStatus = filters.status ? trip.status === filters.status : true;
    const matchesDate = filters.date ? dayjs(trip.scheduled_at).isSame(filters.date, 'day') : true;
    const matchesOptimized = filters.optimized ? (filters.optimized === 'optimized' ? trip.meta?.optimized_at : !trip.meta?.optimized_at) : true;
    return matchesStatus && matchesDate && matchesOptimized;
  });

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Link to={`/trips/${record.id}`}>{text || `#${record.id}`}</Link>
      ),
    },
    {
      title: t('start.address'),
      dataIndex: 'start_address',
      key: 'start_address',
    },
    {
      title: t('scheduled.at'),
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: t('stops'),
      key: 'stops',
      render: (_, record) => record.locations?.length || 0,
    },
    {
      title: t('optimized'),
      dataIndex: 'meta',
      key: 'optimized',
      render: (meta) => {
        if (meta?.optimized_at) {
          return <Tag color='green'>{t('optimized')}</Tag>;
        }
        if (meta?.optimization_failure_reason) {
          return <Tag color='red'>{t('failed')}</Tag>;
        }
        return <Tag color='orange'>{t('pending')}</Tag>;
      },
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size='small'
            type='primary'
            disabled={!!record.meta?.optimized_at}
            onClick={() => handleOptimize(record)}
          >
            {t('optimize')}
          </Button>
        </Space>
      ),
    },
  ];

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleBulkOptimize = () => {
    // Implement bulk optimize logic
    selectedRowKeys.forEach((tripId) => {
      handleOptimize({ id: tripId });
    });
  };

  const handleExport = () => {
    // Implement export logic
    console.log('Exporting trips:', selectedRowKeys);
  };

  return (
    <Card
      title={t('trips')}
      extra={<Button type='primary' onClick={() => setCreateVisible(true)}>{t('create')}</Button>}
    >
      <Space direction='vertical' style={{ width: '100%' }}>
        <Space style={{ marginBottom: 16 }}>
          <Select placeholder={t('status')} onChange={(value) => handleFilterChange('status', value)}>
            <Select.Option value=''>{t('all')}</Select.Option>
            <Select.Option value='pending'>{t('pending')}</Select.Option>
            <Select.Option value='completed'>{t('completed')}</Select.Option>
          </Select>
          <DatePicker onChange={(date) => handleFilterChange('date', date)} />
          <Select placeholder={t('optimized')} onChange={(value) => handleFilterChange('optimized', value)}>
            <Select.Option value=''>{t('all')}</Select.Option>
            <Select.Option value='optimized'>{t('optimized')}</Select.Option>
            <Select.Option value='not_optimized'>{t('not_optimized')}</Select.Option>
          </Select>
        </Space>
        <Space style={{ marginBottom: 16 }}>
          <Button onClick={handleBulkOptimize} disabled={!selectedRowKeys.length}>{t('optimize.selected')}</Button>
          <Button onClick={handleExport} disabled={!selectedRowKeys.length}>{t('export')}</Button>
          <Button type="primary" icon={<span role="img" aria-label="map">🗺️</span>} onClick={() => navigate('/trips/tracking')}>
            {t('live.tracking')}
          </Button>
        </Space>
        <Table rowKey='id' loading={loading} columns={columns} dataSource={filteredData} rowSelection={rowSelection} />
        <OptimizationAnalytics />
        <SettingsPanel />
      </Space>

      <Modal
        title={t('create.trip')}
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText={t('create')}
        width={800}
      >
        <Form layout='vertical' form={form}>
          <Form.Item name='name' label={t('name')}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name='start_address'
            label={t('start.address')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex', marginBottom: 16 }} align='start'>
            <Form.Item
              name='start_lat'
              label={t('start.lat')}
              rules={[{ required: true, type: 'number' }]}
            >
              <InputNumber style={{ width: 150 }} placeholder='-6.7924' />
            </Form.Item>
            <Form.Item
              name='start_lng'
              label={t('start.lng')}
              rules={[{ required: true, type: 'number' }]}
            >
              <InputNumber style={{ width: 150 }} placeholder='39.2083' />
            </Form.Item>
            <Form.Item name='scheduled_at' label={t('scheduled.at')}>
              <DatePicker showTime />
            </Form.Item>
          </Space>

          <Form.List name='locations' initialValue={[{}]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    align='baseline'
                    style={{ display: 'flex', marginBottom: 8 }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'address']}
                      label={t('stop.address')}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder={t('address')} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'lat']}
                      label='Lat'
                      rules={[{ required: true, type: 'number' }]}
                    >
                      <InputNumber style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'lng']}
                      label='Lng'
                      rules={[{ required: true, type: 'number' }]}
                    >
                      <InputNumber style={{ width: 120 }} />
                    </Form.Item>
                    <Button danger onClick={() => remove(name)}>
                      {t('remove')}
                    </Button>
                  </Space>
                ))}
                <Button type='dashed' onClick={() => add()} style={{ width: '100%' }}>
                  {t('add.stop')}
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
} 