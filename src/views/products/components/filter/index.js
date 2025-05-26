import { Button, Card, Space } from 'antd';
import SearchInput from 'components/search-input';
import { useTranslation } from 'react-i18next';
import { useQueryParams } from 'helpers/useQueryParams';
import { InfiniteSelect } from 'components/infinite-select';
import { useState } from 'react';
import shopService from 'services/restaurant';
import categoryService from 'services/category';
import brandService from 'services/brand';
import { shallowEqual, useSelector } from 'react-redux';
import { ClearOutlined } from '@ant-design/icons';
import kitchenService from 'services/kitchen';

const ProductListFilter = () => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();

  const { loading } = useSelector((state) => state.product, shallowEqual);

  const [hasMore, setHasMore] = useState({
    shop: false,
    category: false,
    brand: false,
    kitchen: false,
  });
  const [selectedValues, setSelectedValues] = useState({
    shop: undefined,
    category: undefined,
    brand: undefined,
    kitchen: undefined,
  });

  const handleFilter = (key, value) => {
    const isSearch = key === 'search';
    const resetCondition = isSearch ? !value?.length : !value?.value;

    if (resetCondition) {
      queryParams.reset(key);
      if (!isSearch) {
        setSelectedValues({ ...selectedValues, [key]: undefined });
      }
    } else {
      queryParams.set(key, isSearch ? value : value?.value);
      if (!isSearch) {
        setSelectedValues({ ...selectedValues, [key]: value });
      }
    }
  };

  const handleResetFilters = () => {
    queryParams.resetMultiple(['search', 'shop', 'category', 'brand']);
    setSelectedValues({
      shop: undefined,
      category: undefined,
      brand: undefined,
    });
  };

  const fetchShops = ({ search, page = 1 }) => {
    const params = {
      search: search?.length ? search : undefined,
      status: 'approved',
      page,
    };
    return shopService.search(params).then((res) => {
      setHasMore({
        ...hasMore,
        shop: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res?.data?.map((item) => ({
        label: item?.translation?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const fetchCategories = ({ search, page = 1 }) => {
    const params = {
      type: 'main',
      search: search?.length ? search : undefined,
      page,
      shop_id: queryParams.get('shop') || undefined,
    };
    return categoryService.search(params).then((res) => {
      setHasMore({
        ...hasMore,
        category: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res?.data?.map((item) => ({
        label: item?.translation?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const fetchBrands = ({ search, page = 1 }) => {
    const params = { search: search?.length ? search : undefined, page };
    return brandService.search(params).then((res) => {
      setHasMore({
        ...hasMore,
        brand: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res?.data?.map((item) => ({
        label: item?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  const fetchKitchens = ({ search, page = 1 }) => {
    const params = {
      search: search?.length ? search : undefined,
      page,
      active: 1,
    };
    return kitchenService.getAll(params).then((res) => {
      setHasMore({
        ...hasMore,
        kitchen: res?.meta?.current_page < res?.meta?.last_page,
      });
      return res?.data?.map((item) => ({
        label: item?.translation?.title || item?.id || t('N/A'),
        value: item?.id,
        key: item?.id,
      }));
    });
  };

  return (
    <Card>
      <Space>
        <SearchInput
          placeholder={t('search')}
          handleChange={(e) => handleFilter('search', e)}
          defaultValue={queryParams.get('search') || ''}
          resetSearch={() => queryParams.reset('search')}
          style={{ width: 200 }}
          loading={loading}
        />
        <InfiniteSelect
          placeholder={t('select.shop')}
          hasMore={hasMore.shop}
          fetchOptions={fetchShops}
          style={{ minWidth: 200 }}
          onChange={(value) => handleFilter('shop', value)}
          onClear={() => queryParams.reset('shop')}
          loading={loading}
          value={selectedValues.shop}
        />
        <InfiniteSelect
          placeholder={t('select.category')}
          hasMore={hasMore.category}
          fetchOptions={fetchCategories}
          style={{ minWidth: 200 }}
          onChange={(value) => handleFilter('category', value)}
          onClear={() => queryParams.reset('category')}
          refetchOnFocus={!!queryParams.get('shop')}
          loading={loading}
          value={selectedValues.category}
        />
        <InfiniteSelect
          placeholder={t('select.brand')}
          hasMore={hasMore.brand}
          fetchOptions={fetchBrands}
          style={{ minWidth: 200 }}
          onChange={(value) => handleFilter('brand', value)}
          onClear={() => queryParams.reset('brand')}
          refetchOnFocus={!!queryParams.get('brand')}
          loading={loading}
          value={selectedValues.brand}
        />
        <InfiniteSelect
          placeholder={t('select.kitchen')}
          hasMore={hasMore.kitchen}
          fetchOptions={fetchKitchens}
          style={{ minWidth: 200 }}
          onChange={(value) => handleFilter('kitchen', value)}
          onClear={() => queryParams.reset('kitchen')}
          refetchOnFocus={!!queryParams.get('kitchen')}
          loading={loading}
          value={selectedValues.kitchen}
        />
        <Button icon={<ClearOutlined />} onClick={handleResetFilters}>
          {t('reset.filters')}
        </Button>
      </Space>
    </Card>
  );
};

export default ProductListFilter;
