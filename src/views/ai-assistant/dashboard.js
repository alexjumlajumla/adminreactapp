import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Tag, 
  Progress, 
  Spin, 
  Alert, 
  List, 
  Divider,
  Typography,
  Button
} from 'antd';
import {
  UserOutlined,
  SoundOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import axiosClient from '../../services/request';
import moment from 'moment';

const { Title, Text } = Typography;

// Fallback component for when charts can't be loaded
const ChartFallback = ({ title, data, type }) => {
  return (
    <Card title={title} className="chart-fallback">
      <Alert
        message={`${type === 'line' ? 'Line' : 'Pie'} chart could not be displayed`}
        description="The chart visualization library could not be loaded. Showing data in tabular format instead."
        type="info"
        showIcon
        style={{ marginBottom: 15 }}
      />
      
      {type === 'line' ? (
        <div>
          <Table
            dataSource={data || []}
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date' },
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Count', dataIndex: 'count', key: 'count' }
            ]}
            size="small"
            pagination={false}
            rowKey={(record) => `${record.date}-${record.type}`}
          />
        </div>
      ) : (
        <div>
          <Table
            dataSource={data || []}
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type' },
              { title: 'Value', dataIndex: 'value', key: 'value' }
            ]}
            size="small"
            pagination={false}
            rowKey="type"
          />
        </div>
      )}
    </Card>
  );
};

// Fallback component for chart error
const ChartErrorBoundary = ({ children, fallback, title, data, type }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return fallback || <ChartFallback title={title} data={data} type={type} />;
  }
  
  return (
    <div onError={() => setHasError(true)}>
      {children}
    </div>
  );
};

const AIAssistantDashboard = () => {
  const [statistics, setStatistics] = useState({});
  const [topFilters, setTopFilters] = useState([]);
  const [topExclusions, setTopExclusions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safely import charts to prevent crashes if package is missing
  const [ChartsLoaded, setChartsLoaded] = useState(false);
  const [Line, setLine] = useState(null);
  const [Pie, setPie] = useState(null);

  // Load chart components dynamically
  useEffect(() => {
    const loadCharts = async () => {
      try {
        const charts = await import('@ant-design/plots').catch(err => {
          console.error("Error importing charts package:", err.message);
          throw new Error("Charts package not available");
        });
        
        if (charts && charts.Line && charts.Pie) {
          setLine(() => charts.Line);
          setPie(() => charts.Pie);
          setChartsLoaded(true);
        } else {
          throw new Error("Required chart components not found in package");
        }
      } catch (err) {
        console.error("Error loading chart components:", err);
        setChartsLoaded(false);
      }
    };
    
    loadCharts();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch statistics directly with axios to have more control over error handling
      const statsResponse = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/statistics');
      const filtersResponse = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/top-filters');
      const exclusionsResponse = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/top-exclusions');
      
      setStatistics(statsResponse.data.data || {});
      setTopFilters(filtersResponse.data.data || []);
      setTopExclusions(exclusionsResponse.data.data || []);
      
    } catch (err) {
      console.error('Error fetching AI Assistant data:', err);
      setError('Failed to load AI Assistant statistics: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading AI Assistant statistics...</p>
      </div>
    );
  }

  // Process data for charts and statistics
  const successRate = statistics?.total_requests > 0
    ? ((statistics.successful_requests / statistics.total_requests) * 100).toFixed(1)
    : 0;

  // Configuration for usage by date chart
  const usageByDateConfig = {
    data: statistics?.usage_by_date || [],
    xField: 'date',
    yField: 'count',
    seriesField: 'type',
    legend: {
      position: 'top',
    },
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  // Configuration for request types pie chart
  const requestTypeConfig = {
    appendPadding: 10,
    data: statistics?.request_types || [],
    angleField: 'value',
    colorField: 'type',
    radius: 0.75,
    label: {
      type: 'spider',
      labelHeight: 28,
      content: '{name}: {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
  };

  // Charts Rendering Section - Modify to handle missing chart dependencies
  const renderUsageChart = () => {
    if (!ChartsLoaded || !Line) {
      return (
        <ChartFallback 
          title="Usage by Date" 
          data={statistics?.usage_by_date || []}
          type="line"
        />
      );
    }
    
    return (
      <Card title="Usage by Date">
        <ChartErrorBoundary 
          title="Usage by Date" 
          data={statistics?.usage_by_date || []}
          type="line"
        >
          <Line {...usageByDateConfig} />
        </ChartErrorBoundary>
      </Card>
    );
  };
  
  const renderRequestTypeChart = () => {
    if (!ChartsLoaded || !Pie) {
      return (
        <ChartFallback 
          title="Request Types" 
          data={statistics?.request_types || []}
          type="pie"
        />
      );
    }
    
    return (
      <Card title="Request Types">
        <ChartErrorBoundary 
          title="Request Types" 
          data={statistics?.request_types || []}
          type="pie"
        >
          <Pie {...requestTypeConfig} />
        </ChartErrorBoundary>
      </Card>
    );
  };
  
  return (
    <div className="ai-assistant-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2}>AI Assistant Dashboard</Title>
          <Text type="secondary">Overview of AI voice ordering and assistance system</Text>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          action={
            <Button size="small" type="primary" onClick={handleRefresh}>
              Try Again
            </Button>
          }
        />
      )}
      
      <Row gutter={[24, 24]} className="mt-4">
        {/* Key Metrics */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={statistics?.total_requests || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={successRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress
              percent={successRate || 0}
              size="small"
              status={successRate >= 75 ? 'success' : successRate >= 50 ? 'normal' : 'exception'}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Processing Time"
              value={statistics?.avg_processing_time || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={statistics?.active_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Charts Row */}
        <Col xs={24} lg={12}>
          {renderUsageChart()}
        </Col>
        
        <Col xs={24} lg={12}>
          {renderRequestTypeChart()}
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} className="mt-4">
        {/* Top Filters */}
        <Col xs={24} md={12}>
          <Card title="Top Food Filters" className="card-with-list">
            <List
              dataSource={topFilters || []}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.filter}
                    description={
                      <Progress 
                        percent={item.percentage || 0} 
                        size="small" 
                        format={() => `${item.count || 0} times`}
                      />
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No filter data available' }}
            />
          </Card>
        </Col>
        
        {/* Top Exclusions */}
        <Col xs={24} md={12}>
          <Card title="Top Food Exclusions" className="card-with-list">
            <List
              dataSource={topExclusions || []}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={item.exclusion}
                    description={
                      <Progress 
                        percent={item.percentage || 0} 
                        size="small" 
                        format={() => `${item.count || 0} times`}
                        strokeColor="#f5222d"
                      />
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No exclusion data available' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="mt-4">
        {/* Request Status */}
        <Col xs={24} lg={8}>
          <Card title="Recent Status">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Successful"
                  value={statistics?.successful_requests || 0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Failed"
                  value={statistics?.failed_requests || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Voice Orders"
                  value={statistics?.voice_order_count || 0}
                  prefix={<SoundOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Text Chats"
                  value={statistics?.text_chat_count || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        
        {/* Daily Trends */}
        <Col xs={24} lg={8}>
          <Card title="Daily Metrics">
            <Statistic
              title="Today's Requests"
              value={statistics?.today_requests || 0}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 10 }}>
              <Text type="secondary">
                Compared to yesterday:
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
                {statistics?.today_vs_yesterday > 0 ? (
                  <>
                    <RiseOutlined style={{ color: '#3f8600', marginRight: 8 }} />
                    <Text style={{ color: '#3f8600' }}>
                      {Math.abs(statistics.today_vs_yesterday)}% increase
                    </Text>
                  </>
                ) : statistics?.today_vs_yesterday < 0 ? (
                  <>
                    <FallOutlined style={{ color: '#cf1322', marginRight: 8 }} />
                    <Text style={{ color: '#cf1322' }}>
                      {Math.abs(statistics.today_vs_yesterday)}% decrease
                    </Text>
                  </>
                ) : (
                  <Text>No change</Text>
                )}
              </div>
            </div>
            <Divider />
            <Statistic
              title="Avg Request Time (today)"
              value={statistics?.today_avg_time || 0}
              suffix="ms"
            />
          </Card>
        </Col>
        
        {/* Most Popular Products */}
        <Col xs={24} lg={8}>
          <Card title="Most Recommended Products">
            {statistics?.top_products && statistics.top_products.length > 0 ? (
              <List
                dataSource={statistics.top_products}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.product_name || 'Unknown Product'}
                      description={`Recommended ${item.count || 0} times`}
                    />
                    <Tag color="green">{item.category || 'N/A'}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary">No product recommendation data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AIAssistantDashboard; 