import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useQueryParams } from 'helpers/useQueryParams';
import userService from 'services/seller/user';
import createImage from 'helpers/createImage';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useDidUpdate from 'helpers/useDidUpdate';
import { disableRefetch } from 'redux/slices/menu';
import moment from 'moment';
import UserEditDetails from './components/details';
import UserEditDeliverymanZone from './components/deliveryman-zone';

const { TabPane } = Tabs;

const ShopUsersEdit = () => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const dispatch = useDispatch();
  const { uuid } = useParams();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [currentTab, setCurrentTab] = useState(
    queryParams.get('tab') || 'details',
  );
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line
  }, [uuid]);

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetch();
    }
  }, [activeMenu.refetch]);

  const fetchUser = (uuid) => {
    setLoading(true);
    userService
      .getById(uuid)
      .then((res) => {
        const body = {
          ...res?.data,
          avatar: res?.data?.img ? [createImage(res?.data?.img)] : [],
          birthday: res?.data?.birthday ? moment(res?.data?.birthday) : null,
        };
        setUserData(body);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetch = () => {
    if (uuid) {
      fetchUser(uuid);
      dispatch(disableRefetch(activeMenu));
    }
  };

  const handleChangeTab = (tab) => {
    setCurrentTab(tab);
    queryParams.set('tab', tab);
  };

  return (
    <Card title={t('edit.user')}>
      <Tabs
        activeKey={currentTab}
        onChange={handleChangeTab}
        tabPosition='left'
        size='small'
      >
        <TabPane key='details' tab={t('edit.user')}>
          <Card loading={loading}>
            <UserEditDetails data={userData} />
          </Card>
        </TabPane>
        {userData?.role === 'deliveryman' && (
          <TabPane key='deliverymanzone' tab={t('deliveryman.zone')}>
            <Card loading={loading}>
              <UserEditDeliverymanZone data={userData} />
            </Card>
          </TabPane>
        )}
      </Tabs>
    </Card>
  );
};

export default ShopUsersEdit;
