import { store } from 'redux/store';
import { MAP_API_KEY } from 'configs/app-global';

const getMapApiKey = () => {
  const { google_map_key } = store.getState()?.globalSettings?.settings;

  return google_map_key || MAP_API_KEY;
};

export default getMapApiKey;
