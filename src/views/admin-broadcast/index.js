import React, { useState, useRef } from 'react';
import { Card, Form, Input, Checkbox, Button, Row, Col, message, Upload } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import request from '../../services/request';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import { export_url } from '../../configs/app-global';
import '../../assets/css/broadcast.css';

const groupOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Seller', value: 'seller' },
  { label: 'Deliveryman', value: 'deliveryman' },
  { label: 'Customer', value: 'user' },
  { label: 'Customer Care', value: 'customer_care' },
  { label: 'Product Manager', value: 'product_manager' },
  { label: 'Director', value: 'director' },
  { label: 'Manager', value: 'manager' },
  { label: 'Marketing', value: 'marketing' },
];

const channelOptions = [
  { label: 'Push', value: 'push' },
  { label: 'Email', value: 'email' },
];

export default function AdminBroadcastSend() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [customEmails, setCustomEmails] = useState([]);
  const quillRef = useRef(null);

  const submit = (values) => {
    setLoading(true);
    const encoded = btoa(unescape(encodeURIComponent(body)));
    request.post('dashboard/admin/broadcasts/send', { ...values, body: encoded, custom_emails: customEmails })
      .then(() => {
        message.success(t('sent.successfully'));
        form.resetFields();
      })
      .catch(() => message.error(t('something.went.wrong')))
      .finally(() => setLoading(false));
  };

  return (
    <Card title={t('broadcast.send')}>
      <Form layout='vertical' form={form} onFinish={submit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name='title' label={t('title')} rules={[{ required: true }]}> 
              <Input maxLength={255} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label={t('message')} required>
          <ReactQuill 
            theme='snow' 
            value={body} 
            onChange={setBody} 
            ref={quillRef}
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
              ],
            }}
            formats={['header','bold','italic','underline','strike','list','bullet','link','image']}
            style={{ height: 300, marginBottom: 40 }}
            className='quill-broadcast-editor'
          />
        </Form.Item>

        {/* simple image uploader that inserts the hosted url into the editor */}
        <Form.Item label={t('image')}>
          <Upload
            name='file'
            accept='image/*'
            showUploadList={false}
            customRequest={async ({file, onSuccess, onError}) => {
              const formData = new FormData();
              formData.append('image', file);
              formData.append('type', 'banners');
              try {
                const res = await request.post('dashboard/galleries', formData, { headers: {'Content-Type':'multipart/form-data'}});
                const path = res.data?.data?.title || res.data?.title;
                if (path) {
                  const url = export_url + path;
                  if (quillRef.current) {
                    const editor = quillRef.current.getEditor();
                    const range = editor.getSelection(true);
                    editor.insertEmbed(range ? range.index : 0, 'image', url);
                  } else {
                    setBody(prev => prev + `<p><img src="${url}" alt="img" /></p>`);
                  }
                }
                onSuccess();
              } catch(e) {
                onError(e);
              }
            }}
          >
            <Button icon={<UploadOutlined />}>{t('upload.image')}</Button>
          </Upload>
        </Form.Item>

        {/* CSV upload for custom email recipients */}
        <Form.Item label={t('custom.emails') + ' (CSV)'} help={customEmails.length ? `${customEmails.length} ${t('emails.loaded')}` : t('csv.email.guidance')} >
          <Upload.Dragger
            accept='.csv'
            beforeUpload={(file) => {
              Papa.parse(file, {
                complete: (results) => {
                  const emails = results.data.flat().map((e) => String(e).trim()).filter((e) => /.+@.+\..+/.test(e));
                  setCustomEmails(emails);
                  message.success(t('emails.loaded') + `: ${emails.length}`);
                },
                error: () => message.error(t('file.parse.error')),
              });
              return false; // prevent upload
            }}
            showUploadList={false}
          >
            <p className='ant-upload-drag-icon'>
              <InboxOutlined />
            </p>
            <p className='ant-upload-text'>{t('click.or.drag.file')}</p>
          </Upload.Dragger>
        </Form.Item>

        <Form.Item name='channels' label={t('channels')} rules={[{ required: true }]}> 
          <Checkbox.Group options={channelOptions} />
        </Form.Item>

        <Form.Item name='groups' label={t('recipient.groups')} rules={[{ required: true }]}> 
          <Checkbox.Group options={groupOptions} />
        </Form.Item>

        <Button type='primary' htmlType='submit' loading={loading}>
          {t('send')}
        </Button>
      </Form>
    </Card>
  );
} 