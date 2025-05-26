import { Button, Card, Col, Form, Input, Row } from 'antd';
import { useTranslation } from 'react-i18next';

const PropertyEdit = ({ property, editProperty }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const onFinish = (values) => {
    editProperty({ ...property, ...values });
  };

  return (
    <Card>
      <Form
        form={form}
        layout='vertical'
        onFinish={onFinish}
        initialValues={{
          key: property?.key,
          value: property?.value,
        }}
      >
        <Row gutter={12}>
          <Col span={24}>
            <Form.Item
              label={t('key')}
              name='key'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
                {
                  type: 'string',
                  min: 2,
                  max: 200,
                  message: t('min.2.max.200.chars'),
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={t('value')}
              name='value'
              rules={[
                {
                  required: true,
                  message: t('required'),
                },
                {
                  type: 'string',
                  min: 2,
                  max: 200,
                  message: t('min.2.max.200.chars'),
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Button type='primary' htmlType='submit' className='w-100'>
              {t('edit')}
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default PropertyEdit;
