import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';
import shopService from 'services/shop';
import brandService from 'services/brand';
import categoryService from 'services/category';
import useDidUpdate from 'helpers/useDidUpdate';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchRestProducts } from 'redux/slices/product';
import SearchInput from 'components/search-input';
import { useTranslation } from 'react-i18next';
import { clearCart, setCartData } from 'redux/slices/cart';
import { fetchRestPayments } from 'redux/slices/payment';
import { disableRefetch } from 'redux/slices/menu';
import { getCartData } from 'redux/selectors/cartSelector';
import { InfiniteSelect } from 'components/infinite-select';
import createSelectObject from 'helpers/createSelectObject';

const Filter = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { allShops } = useSelector((state) => state.allShops, shallowEqual);
  const { currentBag } = useSelector((state) => state.cart, shallowEqual);
  const cartData = useSelector((state) => getCartData(state.cart));

  const [brand, setBrand] = useState(null);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState(null);
  const [hasMore, setHasMore] = useState({
    shop: false,
    category: false,
    brand: false,
  });

  const activeShop = createSelectObject(allShops[0]);

  const fetchUserShop = async ({ search, page }) => {
    const params = {
      search: search?.length ? search : undefined,
      page,
      status: 'approved',
      verify: 1,
      open: 1,
    };
    return await shopService.search(params).then((res) => {
      setHasMore((prev) => ({ ...prev, shop: !!res?.links?.next }));
      return res.data.map((item) => ({
        label: item?.translation?.title || 'no name',
        value: item?.id,
      }));
    });
  };

  const fetchUserBrand = async ({ search, page = 1 }) => {
    const params = { search: search?.length ? search : undefined, page };
    return await brandService.search(params).then((res) => {
      setHasMore((prev) => ({ ...prev, brand: !!res?.links?.next }));
      return res.data.map((item) => ({
        label: item?.title,
        value: item?.id,
      }));
    });
  };

  const fetchUserCategory = async ({ search, page }) => {
    const params = {
      search: search?.length ? search : undefined,
      page,
      type: 'main',
    };
    return await categoryService.search(params).then((res) => {
      setHasMore((prev) => ({ ...prev, category: !!res?.links?.next }));
      return res.data.map((item) => ({
        label:
          item?.translation !== null ? item?.translation?.title : 'no name',
        value: item.id,
      }));
    });
  };

  const selectShop = () => dispatch(clearCart());

  useDidUpdate(() => {
    const params = {
      brand_id: brand?.value,
      category_id: category?.value,
      search,
      shop_id: !!cartData?.shop?.value
        ? cartData?.shop?.value
        : activeShop?.value,
      status: 'published',
      perPage: 12,
    };
    dispatch(fetchRestProducts(params));
  }, [brand, category, search, cartData?.shop?.value]);

  useEffect(() => {
    const body = {
      shop_id: activeShop?.value,
    };
    if (activeMenu.refetch) {
      dispatch(fetchRestPayments(body));
      dispatch(setCartData({ bag_id: currentBag, shop: activeShop }));
      dispatch(disableRefetch(activeMenu));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu.refetch]);

  return (
    <Card>
      <Row gutter={12}>
        <div style={{ display: 'flex', rowGap: '20px', flexWrap: 'wrap' }}>
          <Col span={6}>
            <SearchInput
              className='w-100'
              placeholder={t('search')}
              handleChange={setSearch}
            />
          </Col>
          <Col span={6}>
            <InfiniteSelect
              className='w-100'
              hasMore={hasMore?.shop}
              debounceTimeout={500}
              placeholder={t('select.shop')}
              fetchOptions={fetchUserShop}
              allowClear={false}
              onChange={(value) => {
                dispatch(
                  setCartData({
                    bag_id: currentBag,
                    shop: value,
                    deliveryZone: null,
                    table: null,
                  }),
                );
                selectShop();
              }}
              value={!!cartData?.shop?.value ? cartData?.shop : activeShop}
            />
          </Col>
          <Col span={6}>
            <InfiniteSelect
              className='w-100'
              hasMore={hasMore?.category}
              placeholder={t('select.category')}
              fetchOptions={fetchUserCategory}
              onChange={(value) => setCategory(value)}
              value={category}
            />
          </Col>
          <Col span={6}>
            <InfiniteSelect
              hasMore={hasMore?.brand}
              className='w-100'
              placeholder={t('select.brand')}
              fetchOptions={fetchUserBrand}
              onChange={(value) => setBrand(value)}
              value={brand}
            />
          </Col>
        </div>
      </Row>
    </Card>
  );
};
export default Filter;
