import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Button,
  Tag,
  Form,
  Spin,
  Pagination,
  Modal,
  Select,
  Space,
  Image
} from 'antd';
import { EditOutlined, SearchOutlined, PlusOutlined, CloseOutlined, PictureOutlined } from '@ant-design/icons';
import axiosClient from '../../services/request';

const { Option } = Select;

const AIProductMetadata = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    calories: '',
    ingredient_tags: [],
    allergen_flags: [],
    representative_image: '',
  });

  const commonIngredientOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten Free' },
    { value: 'dairy-free', label: 'Dairy Free' },
    { value: 'sugar-free', label: 'Sugar Free' },
    { value: 'organic', label: 'Organic' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'high-protein', label: 'High Protein' },
  ];
  
  const allergenOptions = [
    { value: 'peanut', label: 'Peanuts' },
    { value: 'tree-nuts', label: 'Tree Nuts' },
    { value: 'milk', label: 'Milk' },
    { value: 'egg', label: 'Eggs' },
    { value: 'wheat', label: 'Wheat' },
    { value: 'soy', label: 'Soy' },
    { value: 'fish', label: 'Fish' },
    { value: 'shellfish', label: 'Shellfish' },
    { value: 'sesame', label: 'Sesame' },
  ];

  useEffect(() => {
    fetchProducts();
  }, [pagination.current, searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        per_page: pagination.pageSize,
        search: searchTerm,
      };
      // Note: This endpoint assumes you have a products API that supports pagination and search
      const response = await axiosClient.get('/api/v1/dashboard/admin/products', { params });
      setProducts(response.data.data || []);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
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

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      calories: product.calories || '',
      ingredient_tags: product.ingredient_tags || [],
      allergen_flags: product.allergen_flags || [],
      representative_image: product.representative_image || '',
    });
    setEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (value, name) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        calories: formData.calories,
        ingredient_tags: formData.ingredient_tags,
        allergen_flags: formData.allergen_flags,
        representative_image: formData.representative_image,
      };
      
      await axiosClient.put(`/api/v1/dashboard/admin/ai-assistant/product-metadata/${currentProduct.id}`, payload);
      
      // Update the product in the local state
      setProducts(products.map(product => 
        product.id === currentProduct.id 
          ? { ...product, ...payload } 
          : product
      ));
      
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating product metadata:', error);
    }
  };

  const handleGenerateImage = async () => {
    try {
      const response = await axiosClient.post(
        `/api/v1/dashboard/admin/ai-assistant/generate-product-image/${currentProduct.id}`
      );
      
      // Update the image URL in the form
      if (response.data && response.data.image_url) {
        setFormData({
          ...formData,
          representative_image: response.data.image_url,
        });
      }
    } catch (error) {
      console.error('Error generating product image:', error);
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
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Calories',
      dataIndex: 'calories',
      key: 'calories',
      render: (calories) => calories || '-',
    },
    {
      title: 'Ingredients',
      dataIndex: 'ingredient_tags',
      key: 'ingredient_tags',
      render: (tags) => (
        <>
          {tags && tags.length > 0
            ? tags.map((tag) => (
                <Tag color="blue" key={tag}>
                  {tag}
                </Tag>
              ))
            : '-'}
        </>
      ),
    },
    {
      title: 'Allergens',
      dataIndex: 'allergen_flags',
      key: 'allergen_flags',
      render: (flags) => (
        <>
          {flags && flags.length > 0
            ? flags.map((flag) => (
                <Tag color="orange" key={flag}>
                  {flag}
                </Tag>
              ))
            : '-'}
        </>
      ),
    },
    {
      title: 'Popularity Score',
      dataIndex: 'popularity_score',
      key: 'popularity_score',
      render: (score) => score || 0,
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
      <h2 className="mb-4">AI Product Metadata</h2>
      
      <Card className="mb-4">
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            onSearch={() => fetchProducts()}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={products}
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
        title={`Edit AI Metadata - ${currentProduct?.name}`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSubmit}
        width={800}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Calories">
                <Input
                  type="number"
                  name="calories"
                  placeholder="Enter calories per serving"
                  value={formData.calories}
                  onChange={handleInputChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Representative Image URL">
                <Input
                  name="representative_image"
                  placeholder="Image URL"
                  value={formData.representative_image}
                  onChange={handleInputChange}
                  addonAfter={
                    <Button
                      type="text"
                      icon={<PictureOutlined />}
                      onClick={handleGenerateImage}
                    />
                  }
                />
                <div className="text-muted" style={{ fontSize: '12px' }}>
                  Click the icon to generate an AI image (if available)
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ingredient Tags">
                <Select
                  mode="multiple"
                  placeholder="Select or type ingredients..."
                  value={formData.ingredient_tags}
                  onChange={(value) => handleSelectChange(value, 'ingredient_tags')}
                  style={{ width: '100%' }}
                  options={commonIngredientOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Allergen Flags">
                <Select
                  mode="multiple"
                  placeholder="Select allergens..."
                  value={formData.allergen_flags}
                  onChange={(value) => handleSelectChange(value, 'allergen_flags')}
                  style={{ width: '100%' }}
                  options={allergenOptions}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          {formData.representative_image && (
            <Row>
              <Col span={24} style={{ textAlign: 'center' }}>
                <Image
                  src={formData.representative_image}
                  alt="Product"
                  style={{ maxHeight: '200px' }}
                />
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AIProductMetadata; 