import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Tag,
  Spin,
  Pagination,
  Modal,
  Form,
  Switch,
  DatePicker,
  Space
} from 'antd';
import { EditOutlined, SearchOutlined, UserOutlined, StarOutlined } from '@ant-design/icons';
import axiosClient from '../../services/request';
import moment from 'moment';

const AIUserCredits = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    ai_order_credits: 0,
    is_premium: false,
    premium_expires_at: null,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        per_page: pagination.pageSize,
        search: searchTerm,
      };
      // Note: This endpoint assumes you have a users API that supports pagination and search
      const response = await axiosClient.get('/api/v1/dashboard/admin/users', { params });
      setUsers(response.data.data || []);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination({
      ...pagination,
      current: 1,
    });
  };

  const handlePageChange = (page) => {
    setPagination({
      ...pagination,
      current: page,
    });
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      ai_order_credits: user.ai_order_credits || 0,
      is_premium: user.is_premium || false,
      premium_expires_at: user.premium_expires_at ? moment(user.premium_expires_at) : null,
    });
    setEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSwitchChange = (checked) => {
    setFormData({
      ...formData,
      is_premium: checked,
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      premium_expires_at: date,
    });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ai_order_credits: parseInt(formData.ai_order_credits),
        is_premium: formData.is_premium,
        premium_expires_at: formData.premium_expires_at ? formData.premium_expires_at.format('YYYY-MM-DD HH:mm:ss') : null,
      };
      
      await axiosClient.put(`/api/v1/dashboard/admin/ai-assistant/user-credits/${currentUser.id}`, payload);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === currentUser.id 
          ? { ...user, ...payload } 
          : user
      ));
      
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user AI credits:', error);
    }
  };

  const formatPremiumStatus = (user) => {
    if (!user.is_premium) {
      return <Tag color="default">No</Tag>;
    }
    
    if (user.premium_expires_at) {
      const expiryDate = moment(user.premium_expires_at);
      const now = moment();
      
      if (expiryDate.isAfter(now)) {
        return (
          <Tag color="success">
            Until {expiryDate.format('YYYY-MM-DD')}
          </Tag>
        );
      } else {
        return <Tag color="warning">Expired</Tag>;
      }
    }
    
    return <Tag color="success">Yes</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => `${record.firstname} ${record.lastname}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'AI Order Credits',
      dataIndex: 'ai_order_credits',
      key: 'ai_order_credits',
      render: (credits) => (
        <Tag color={credits > 0 ? 'blue' : 'default'}>
          {credits || 0}
        </Tag>
      ),
    },
    {
      title: 'Premium Status',
      key: 'premium_status',
      render: (_, record) => formatPremiumStatus(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => openEditModal(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <h2 className="mb-4">AI User Credits Management</h2>
      
      <Card className="mb-4">
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={() => fetchUsers()}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title={`Edit AI Credits - ${currentUser?.firstname} ${currentUser?.lastname}`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSubmit}
      >
        <Form layout="vertical">
          <Form.Item label="AI Order Credits">
            <Input
              type="number"
              name="ai_order_credits"
              placeholder="Enter AI order credits"
              value={formData.ai_order_credits}
              onChange={handleInputChange}
              min="0"
            />
          </Form.Item>
          
          <Form.Item label="Premium Status">
            <Space>
              <Switch
                checked={formData.is_premium}
                onChange={handleSwitchChange}
              />
              {formData.is_premium && (
                <Tag color="blue">
                  <StarOutlined /> Premium
                </Tag>
              )}
            </Space>
          </Form.Item>
          
          {formData.is_premium && (
            <Form.Item label="Premium Expiration Date">
              <DatePicker
                value={formData.premium_expires_at}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                disabledDate={(current) => current && current < moment().startOf('day')}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AIUserCredits; 