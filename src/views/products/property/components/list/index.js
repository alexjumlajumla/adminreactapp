import { Button, Card, Space, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import DeleteButton from 'components/delete-button';

const PropertyList = ({
  properties,
  editSelectedProperty,
  deleteProperty,
  loading = false,
}) => {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('key'),
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: t('value'),
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: t('options'),
      key: 'options',
      render: (_, row) => {
        return (
          <Space>
            <Button
              type='primary'
              icon={<EditOutlined />}
              onClick={() => editSelectedProperty(row)}
            />
            <DeleteButton
              type='primary'
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteProperty(row?.id)}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <Card loading={loading}>
      <Table dataSource={properties} columns={columns} pagination={false} />
    </Card>
  );
};

export default PropertyList;
