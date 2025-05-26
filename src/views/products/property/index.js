import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { generateShortUUID } from 'helpers/generateShortUUID';
import { Button, Card, Modal, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import productService from 'services/product';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { setMenuData } from 'redux/slices/menu';
import PropertyList from './components/list';
import PropertyCreate from './components/form/create';
import PropertyEdit from './components/form/edit';

const Property = ({ prev, next, isRequest = false }) => {
  const { t } = useTranslation();
  const { uuid } = useParams();
  const dispatch = useDispatch();

  const { defaultLang } = useSelector((state) => state.formLang, shallowEqual);
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);

  const [dataSource, setDataSource] = useState(
    isRequest ? activeMenu.data?.properties || [] : [],
  );
  const [editSelectedProperty, setEditSelectedProperty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);

  useEffect(() => {
    if (!isRequest) {
      fetchProduct(uuid);
    }
    // eslint-disable-next-line
  }, []);

  const fetchProduct = (uuid) => {
    setLoading(true);
    productService
      .getById(uuid)
      .then((res) => {
        setDataSource(
          res?.data?.properties?.map((item) => ({
            ...item,
            id: generateShortUUID(),
          })),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAddNewProperty = (body) => {
    setDataSource([...dataSource, ...body]);
  };

  const handleEditProperty = (body) => {
    setDataSource((prevDataSource) =>
      prevDataSource.map((item) => {
        if (item.id === body.id) {
          return body;
        }
        return item;
      }),
    );
    setEditSelectedProperty(null);
  };

  const handleDeleteProperty = (id) => {
    Modal.confirm({
      title: t('are.you.sure?'),
      okText: t('yes'),
      onOk: () => {
        setDataSource((prevDataSource) =>
          prevDataSource.filter((item) => item.id !== id),
        );
      },
    });
  };

  const handleSubmit = () => {
    const body = {
      key: [],
      value: [],
    };
    dataSource?.map((dataItem) => {
      body.key.push({ [dataItem?.locale]: dataItem?.key });
      body.value.push({ [dataItem?.locale]: dataItem?.value });
    });
    if (isRequest) {
      dispatch(
        setMenuData({
          activeMenu,
          data: { ...activeMenu.data, properties: dataSource, props: body },
        }),
      );
      next();
      return;
    }
    setLoadingBtn(true);
    productService
      .properties(uuid, body)
      .then(() => {
        toast.success(t('successfully.updated'));
        next();
      })
      .finally(() => {
        setLoadingBtn(false);
      });
  };

  return (
    <>
      <PropertyCreate loading={loading} addNewProperty={handleAddNewProperty} />
      <PropertyList
        loading={loading}
        properties={dataSource?.filter((item) => item?.locale === defaultLang)}
        editSelectedProperty={setEditSelectedProperty}
        deleteProperty={handleDeleteProperty}
      />
      <Card>
        <Space>
          <Button onClick={prev} disabled={loading}>
            {t('prev')}
          </Button>
          <Button
            type='primary'
            onClick={handleSubmit}
            disabled={loading}
            loading={loadingBtn}
          >
            {t('next')}
          </Button>
        </Space>
      </Card>
      {!!editSelectedProperty && (
        <Modal
          visible={!!editSelectedProperty}
          onCancel={() => {
            setEditSelectedProperty(null);
          }}
          footer={false}
        >
          <PropertyEdit
            property={editSelectedProperty}
            editProperty={handleEditProperty}
          />
        </Modal>
      )}
    </>
  );
};

export default Property;
