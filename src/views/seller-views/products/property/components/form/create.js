import { Button, Card, Col, Form, Input, Row } from 'antd';
import { shallowEqual, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { generateShortUUID } from 'helpers/generateShortUUID';

const PropertyForm = ({ addNewProperty, loading = false }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const { defaultLang, languages } = useSelector(
    (state) => state.formLang,
    shallowEqual,
  );

  const onFinish = (values) => {
    const newFirstLocaleProperty = {
      key: values?.[`key[${defaultLang}]`],
      value: values?.[`value[${defaultLang}]`],
    };
    const newProperty = languages.map((lang) => {
      return {
        id: generateShortUUID(),
        locale: lang?.locale,
        key: values?.[`key[${lang?.locale}]`] || newFirstLocaleProperty?.key,
        value:
          values?.[`value[${lang.locale}]`] || newFirstLocaleProperty?.value,
      };
    });
    addNewProperty(newProperty);
    form.resetFields();
  };

  return (
    <Card loading={loading}>
      <Form form={form} layout='vertical' onFinish={onFinish}>
        <Row gutter={12}>
          <Col span={8}>
            {languages.map((item) => (
              <Form.Item
                label={t('key')}
                name={`key[${item?.locale || 'en'}]`}
                key={item?.locale}
                hidden={item?.locale !== defaultLang}
                rules={[
                  {
                    required: item?.locale === defaultLang,
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
            ))}
          </Col>
          <Col span={8}>
            {languages.map((item) => (
              <Form.Item
                label={t('value')}
                name={`value[${item?.locale || 'en'}]`}
                key={item?.locale}
                hidden={item?.locale !== defaultLang}
                rules={[
                  {
                    required: item?.locale === defaultLang,
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
            ))}
          </Col>
          <Col>
            <Form.Item label=' '>
              <Button type='primary' htmlType='submit'>
                {t('add')}
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default PropertyForm;
