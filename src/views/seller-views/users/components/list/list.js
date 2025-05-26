import { Button, Space, Table } from 'antd';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useQueryParams } from 'helpers/useQueryParams';
import { fetchSellerUsers } from 'redux/slices/user';
import { addMenu, disableRefetch } from 'redux/slices/menu';
import { useEffect } from 'react';
import useDidUpdate from 'helpers/useDidUpdate';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ShopUsersList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryParams = useQueryParams();
  const dispatch = useDispatch();
  const {
    users,
    loading,
    meta,
    params: initialParams,
  } = useSelector((state) => state.user.seller, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const params = {
    ...initialParams,
    role: queryParams.get('role') || 'user',
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      is_show: true,
    },
    {
      title: t('firstname'),
      dataIndex: 'firstname',
      is_show: true,
      render: (text) => text || t('N/A'),
    },
    {
      title: t('lastname'),
      dataIndex: 'lastname',
      is_show: true,
      render: (text) => text || t('N/A'),
    },
    {
      title: t('email'),
      dataIndex: 'email',
      is_show: true,
      render: (text) => text || t('N/A'),
    },
    {
      title: t('options'),
      dataIndex: 'uuid',
      is_show: true,
      render: (uuid) => (
        <Space>
          {queryParams.get('role') === 'deliveryman' && (
            <Button icon={<EditOutlined />} onClick={() => goToEdit(uuid)} />
          )}
          <Button
            icon={<EyeOutlined />}
            onClick={() => queryParams.set('uuid', uuid)}
          />
        </Space>
      ),
    },
  ];

  const goToEdit = (uuid) => {
    const link = `seller/shop-users/edit/${uuid}`;
    dispatch(
      addMenu({
        id: 'shop-user-edit',
        url: link,
        name: t(`edit.${queryParams.get('role')}`),
      }),
    );
    navigate(`/${link}`);
  };

  const fetchUsers = (params = {}) => {
    batch(() => {
      dispatch(fetchSellerUsers(params));
      dispatch(disableRefetch(activeMenu));
    });
  };

  const onTableChange = (pagination) => {
    fetchUsers({ ...params, page: pagination?.current });
  };

  useDidUpdate(() => {
    if (activeMenu.refetch) {
      fetchUsers(params);
    }
  }, [activeMenu.refetch]);

  useEffect(() => {
    fetchUsers({ ...params, page: 1 });
    // eslint-disable-next-line
  }, [params?.role]);

  return (
    <Table
      scroll={{ x: true }}
      loading={loading}
      columns={columns.filter((item) => item?.is_show)}
      dataSource={users}
      rowKey={(record) => record?.uuid}
      pagination={{
        total: meta?.total ?? 0,
        defaultCurrent: 1,
        pageSize: params?.perPage ?? 10,
        current: params?.page ?? 1,
      }}
      onChange={onTableChange}
    />
  );
};

export default ShopUsersList;
