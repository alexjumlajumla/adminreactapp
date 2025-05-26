import { Select, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCallback, useState } from 'react';
import debounce from 'lodash/debounce';

const InfiniteSelectPro = ({
  fetchOptions,
  debounceTimeout = 500,
  extractOptions,
  extractMeta,
  allowClear = false,
  ...props
}) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [options, setOptions] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [search, setSearch] = useState('');

  const debounceFetcher = useCallback(
    debounce(
      (
        searchValue = '',
        currentPage = meta.current_page,
        keepPrevOptions = false,
      ) => {
        const params = {
          search: searchValue?.length ? searchValue : undefined,
          page: currentPage,
          perPage: 20,
        };
        setSearch(searchValue);
        return fetchOptions(params)
          .then((res) => {
            const currentMeta = extractMeta(res);
            setMeta({
              current_page: currentMeta?.current_page ?? 1,
              last_page: currentMeta?.last_page ?? 1,
            });
            if (keepPrevOptions) {
              setOptions((prev) => [...prev, ...extractOptions(res)]);
            } else {
              setOptions(extractOptions(res));
            }
          })
          .finally(() => {
            setLoadingSearch(false);
            setLoadingNextPage(false);
            setLoading(false);
          });
      },
      debounceTimeout,
    ),
    [fetchOptions],
  );

  const handleOnFocus = () => {
    if (!options?.length) {
      setLoading(true);
      debounceFetcher('', 1);
    }
  };
  const handleScroll = (event) => {
    if (
      !loadingNextPage &&
      meta?.current_page < meta?.last_page &&
      event.target.scrollTop + event.target.offsetHeight ===
        event.target.scrollHeight
    ) {
      setLoadingNextPage(true);
      debounceFetcher(search, meta.current_page + 1, true);
    }
  };
  const handleSearch = (value) => {
    setLoadingSearch(true);
    debounceFetcher(value, 1, false);
  };

  return (
    <Select
      showSearch
      labelInValue
      allowClear={allowClear}
      onFocus={handleOnFocus}
      onPopupScroll={handleScroll}
      onSearch={handleSearch}
      filterOption={false}
      loading={loadingSearch}
      notFoundContent={loading ? <Spin size='small' /> : t('no.results')}
      {...props}
    >
      {options?.map((item) => (
        <Select.Option key={item?.key} value={item?.value}>
          {item?.label ?? t('N/A')}
        </Select.Option>
      ))}
      {loadingNextPage && (
        <Select.Option key='loading' value='loading' disabled>
          <Spin size='small' />
        </Select.Option>
      )}
    </Select>
  );
};

export default InfiniteSelectPro;
