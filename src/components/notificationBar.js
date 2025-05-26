import React, { useEffect, useState } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { delMany, values } from 'idb-keyval';
import { Badge } from 'antd';
import { toast } from 'react-toastify';
import NotificationDrawer from './notification-drawer';
import PushNotification from './push-notification';
import { useTranslation } from 'react-i18next';

export default function NotificationBar() {
  const { t } = useTranslation();
  const [notificationDrawer, setNotificationDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleFocus = () => {
      getNotifications();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  function getNotifications() {
    values().then((val) => {
      setNotifications(val);
    });
  }

  function clearNotifications() {
    if (!notifications?.length) {
      setNotificationDrawer(false);
      return;
    }
    const notificationIds = notifications?.map((item) => {
      if (typeof item === 'object') {
        return item?.id;
      }
      return item;
    });
    delMany(notificationIds)
      .then(() => {
        setNotifications([]);
        setNotificationDrawer(false);
      })
      .catch((err) => {
        console.log('err => ', err);
        toast.error(t('error.occurred'));
      });
  }

  return (
    <>
      <span className='icon-button' onClick={() => setNotificationDrawer(true)}>
        <Badge count={notifications.length}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </span>

      <NotificationDrawer
        visible={notificationDrawer}
        handleClose={() => setNotificationDrawer(false)}
        list={notifications}
        clear={clearNotifications}
        refetch={getNotifications}
      />
      <PushNotification refetch={getNotifications} />
    </>
  );
}
