import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Dropdown,
  Input,
  Form,
  Select,
  Spin,
  Pagination,
  DatePicker,
  Menu,
  Space,
  Modal,
  Tabs,
  Typography,
  Divider,
  List,
  Badge,
  Alert,
  message
} from 'antd';
import { SearchOutlined, FilterOutlined, CalendarOutlined, EyeOutlined, DownloadOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosClient from '../../services/request';
import { getLogById, getLogs } from '../../services/aiAssistant';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// A robust fallback component when react-json-view is not available
const JsonViewFallback = ({ data }) => {
  const jsonString = JSON.stringify(data, null, 2);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        message.success('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        message.error('Failed to copy: ' + err.message);
      });
  };

  return (
    <div>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          type="primary" 
          size="small" 
          icon={<CopyOutlined />}
          onClick={copyToClipboard}
        >
          Copy
        </Button>
      </div>
      <pre style={{ 
        maxHeight: '500px', 
        overflowY: 'auto', 
        backgroundColor: '#f6f8fa', 
        padding: '12px', 
        borderRadius: '4px',
        border: '1px solid #e1e4e8',
        fontSize: '14px'
      }}>
        {jsonString}
      </pre>
    </div>
  );
};

// A simple error boundary for ReactJson in case it's not loaded properly
const JsonViewWrapper = ({ data }) => {
  const [hasJsonView, setHasJsonView] = useState(false);
  const [ReactJson, setReactJson] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const loadJsonView = async () => {
      try {
        const module = await import('react-json-view').catch(() => {
          // If import fails, set load error to trigger fallback
          throw new Error('react-json-view package is not installed');
        });
        
        if (module && module.default) {
          setReactJson(() => module.default);
          setHasJsonView(true);
        } else {
          throw new Error('Invalid react-json-view module');
        }
      } catch (error) {
        console.error('Error loading react-json-view:', error);
        setLoadError(error.message);
      }
    };
    
    loadJsonView();
  }, []);

  if (loadError) {
    return (
      <div>
        <Alert 
          message="Using fallback JSON viewer" 
          description="Enhanced text-based JSON viewer is being used because the graphical component couldn't be loaded."
          type="info" 
          showIcon 
          style={{ marginBottom: 10 }}
        />
        <JsonViewFallback data={data} />
      </div>
    );
  }

  if (!hasJsonView) {
    return <Spin tip="Loading JSON viewer..." />;
  }

  if (!data) {
    return <Alert message="No data available" type="info" />;
  }

  return (
    <ReactJson
      src={data}
      name={null}
      theme="rjv-default"
      displayDataTypes={false}
      enableClipboard={true}
      collapsed={1}
    />
  );
};

const AIAssistantLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingLogDetails, setLoadingLogDetails] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });
  const [filters, setFilters] = useState({
    request_type: '',
    successful: '',
    date_from: '',
    date_to: '',
  });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { 
        page, 
        per_page: pagination.pageSize, 
        ...filters 
      };
      
      // Direct axios call for more control
      const response = await axiosClient.get('/api/v1/dashboard/admin/ai-assistant/logs', { params });
      
      if (response.data && response.data.data) {
        setLogs(response.data.data || []);
        setPagination({
          current: response.data.current_page || 1,
          pageSize: response.data.per_page || 15,
          total: response.data.total || 0,
        });
      } else {
        setLogs([]);
        console.error('Invalid response format:', response.data);
        setError('Received invalid data format from the server');
      }
    } catch (error) {
      console.error('Error fetching AI assistant logs:', error);
      setError('Failed to fetch logs: ' + (error.response?.data?.message || error.message));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        date_from: dates[0].format('YYYY-MM-DD'),
        date_to: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setFilters({
        ...filters,
        date_from: '',
        date_to: '',
      });
    }
  };

  const applyFilters = () => {
    fetchLogs(1);
  };

  const resetFilters = () => {
    setFilters({
      request_type: '',
      successful: '',
      date_from: '',
      date_to: '',
    });
    fetchLogs(1);
  };

  const handleRefresh = () => {
    fetchLogs(pagination.current);
  };

  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      return moment(dateString).format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || '';
    }
  };

  const truncateText = (text, length = 50) => {
    if (!text) return '';
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  const handleViewLog = async (record) => {
    setSelectedLog({ ...record });
    setViewModalVisible(true);
    setLoadingLogDetails(true);
    
    try {
      // Direct axios call for more control
      const response = await axiosClient.get(`/api/v1/voice-order/log/${record.id}`);
      
      if (response.data && response.data.success && response.data.log) {
        setSelectedLog({
          ...record,
          ...response.data.log,
          debug_info: response.data.debug_info || {}
        });
      } else {
        message.error('Could not load log details: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching log details:', error);
      message.error('Error loading log details: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoadingLogDetails(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) {
      message.warning('Nothing to copy!');
      return;
    }
    
    try {
      navigator.clipboard.writeText(text)
        .then(() => {
          message.success('Copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          message.error('Failed to copy: ' + err.message);
        });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          message.success('Copied to clipboard!');
        } else {
          message.error('Failed to copy');
        }
      } catch (err) {
        message.error('Failed to copy: ' + err.message);
      }
      
      document.body.removeChild(textArea);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user) => {
        if (!user) return 'Guest';
        
        try {
          return `${user.firstname || user.name || ''} ${user.lastname || ''}`.trim() || 'User #' + user.id;
        } catch (error) {
          console.error('Error rendering user:', error);
          return 'Error';
        }
      },
    },
    {
      title: 'Type',
      dataIndex: 'request_type',
      key: 'request_type',
      render: (type) => {
        if (!type) return <Tag>Unknown</Tag>;
        
        let color = 'default';
        if (type === 'voice_order') color = 'blue';
        else if (type === 'realtime_transcription') color = 'purple';
        else if (type === 'repeat_order') color = 'cyan';
        else if (type === 'text') color = 'green';
        
        return (
          <Tag color={color}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: 'Input',
      dataIndex: 'input',
      key: 'input',
      render: (text) => (
        <span title={text}>{truncateText(text)}</span>
      ),
    },
    {
      title: 'Output',
      dataIndex: 'output',
      key: 'output',
      render: (text) => (
        <span title={text}>{truncateText(text)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'successful',
      key: 'successful',
      render: (successful) => (
        <Tag color={successful ? 'success' : 'error'}>
          {successful ? 'Success' : 'Failed'}
        </Tag>
      ),
    },
    {
      title: 'Processing Time',
      dataIndex: 'processing_time_ms',
      key: 'processing_time_ms',
      render: (time) => `${time || 0}ms`,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => handleViewLog(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="mb-4">AI Assistant Logs</h2>
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
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" type="primary" onClick={handleRefresh}>
              Try Again
            </Button>
          }
        />
      )}
      
      <Card className="mb-4">
        <Row gutter={[24, 16]}>
          <Col md={6} sm={12}>
            <Form.Item label="Request Type">
              <Select
                placeholder="All Types"
                value={filters.request_type || undefined}
                onChange={value => handleFilterChange('request_type', value)}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="voice_order">Voice Order</Option>
                <Option value="realtime_transcription">Realtime Transcription</Option>
                <Option value="repeat_order">Repeat Order</Option>
                <Option value="text">Text Chat</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col md={6} sm={12}>
            <Form.Item label="Status">
              <Select
                placeholder="All Status"
                value={filters.successful || undefined}
                onChange={value => handleFilterChange('successful', value)}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="1">Successful</Option>
                <Option value="0">Failed</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col md={12} sm={24}>
            <Form.Item label="Date Range">
              <RangePicker 
                style={{ width: '100%' }}
                onChange={handleDateChange}
                value={
                  filters.date_from && filters.date_to
                    ? [moment(filters.date_from), moment(filters.date_to)]
                    : null
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            style={{ marginRight: 8 }} 
            onClick={resetFilters}
            icon={<ReloadOutlined />}
          >
            Reset
          </Button>
          <Button 
            type="primary" 
            onClick={applyFilters}
            icon={<FilterOutlined />}
          >
            Apply Filters
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handlePageChange,
            showSizeChanger: false,
          }}
          locale={{ emptyText: error ? 'Error loading data' : 'No data available' }}
        />
      </Card>

      {/* Log Details Modal */}
      <Modal
        title={`AI Assistant Log #${selectedLog?.id || ''}`}
        visible={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {loadingLogDetails ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <p>Loading log details...</p>
          </div>
        ) : !selectedLog ? (
          <Alert message="No log data available" type="error" />
        ) : (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Basic Info" key="1">
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    label: 'Request Type',
                    value: (
                      <Tag color={selectedLog?.request_type === 'voice_order' ? 'blue' : 'purple'}>
                        {selectedLog?.request_type || 'Unknown'}
                      </Tag>
                    ),
                  },
                  {
                    label: 'User',
                    value: selectedLog?.user 
                      ? `${selectedLog.user.firstname || selectedLog.user.name || ''} ${selectedLog.user.lastname || ''} (ID: ${selectedLog.user.id || 'Unknown'})` 
                      : 'Guest',
                  },
                  {
                    label: 'Status',
                    value: (
                      <Tag color={selectedLog?.successful ? 'success' : 'error'}>
                        {selectedLog?.successful ? 'Success' : 'Failed'}
                      </Tag>
                    ),
                  },
                  {
                    label: 'Date',
                    value: selectedLog?.created_at ? formatDateTime(selectedLog.created_at) : 'N/A',
                  },
                  {
                    label: 'Processing Time',
                    value: `${selectedLog?.processing_time_ms || 0}ms`,
                  },
                  {
                    label: 'Session ID',
                    value: selectedLog?.session_id || 'N/A',
                  }
                ]}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.label}
                      description={item.value}
                    />
                  </List.Item>
                )}
              />
            </TabPane>
            
            <TabPane tab="Transcription" key="2">
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Title level={5}>User Input</Title>
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => copyToClipboard(selectedLog?.input)}
                    size="small"
                    disabled={!selectedLog?.input}
                  >
                    Copy
                  </Button>
                </div>
                <Paragraph>
                  {selectedLog?.input || 'No input available'}
                </Paragraph>
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Title level={5}>System Response</Title>
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => copyToClipboard(selectedLog?.output)}
                    size="small"
                    disabled={!selectedLog?.output}
                  >
                    Copy
                  </Button>
                </div>
                <Paragraph>
                  {selectedLog?.output || 'No output available'}
                </Paragraph>
              </Card>
            </TabPane>
            
            <TabPane tab="Detected Filters" key="3">
              {selectedLog?.filters_detected ? (
                <JsonViewWrapper data={selectedLog.filters_detected} />
              ) : (
                <Alert message="No filters detected" type="info" />
              )}
            </TabPane>
            
            <TabPane tab="Products" key="4">
              {selectedLog?.product_ids && selectedLog.product_ids.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={selectedLog.product_ids}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={`Product ID: ${item || 'Unknown'}`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Alert message="No products recommended" type="info" />
              )}
            </TabPane>
            
            <TabPane tab="Metadata" key="5">
              {selectedLog?.metadata ? (
                <JsonViewWrapper data={selectedLog.metadata} />
              ) : (
                <Alert message="No metadata available" type="info" />
              )}
            </TabPane>
            
            <TabPane tab="Debug Info" key="6">
              {selectedLog?.debug_info ? (
                <JsonViewWrapper data={selectedLog.debug_info} />
              ) : (
                <Alert message="No debug information available" type="info" />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default AIAssistantLogs; 