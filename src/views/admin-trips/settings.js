import React, { useState } from 'react';
import { Card, Switch, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';

export default function SettingsPanel() {
  const { t } = useTranslation();
  const [aiOptimizationEnabled, setAiOptimizationEnabled] = useState(true);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY || '');

  const handleToggle = (checked) => {
    setAiOptimizationEnabled(checked);
    message.success(t('settings.updated'));
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  const handleTestEndpoint = () => {
    // Implement endpoint test logic
    message.info(t('testing.endpoint'));
  };

  return (
    <Card title={t('settings.panel')}>
      <div style={{ marginBottom: 16 }}>
        <span>{t('ai.optimization')}</span>
        <Switch checked={aiOptimizationEnabled} onChange={handleToggle} style={{ marginLeft: 8 }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <span>{t('api.key')}</span>
        <Input value={apiKey} onChange={handleApiKeyChange} style={{ width: '60%', marginLeft: 8 }} />
      </div>
      <Button type='primary' onClick={handleTestEndpoint}>{t('test.endpoint')}</Button>
    </Card>
  );
} 