import { store } from 'redux/store';
import { LAT, LNG } from 'configs/app-global';

const getMapApiKey = () => {
  const location = store.getState()?.globalSettings?.settings?.location;
  if (location?.length) {
    const splitLocation = location?.split(',');
    return {
      lat: parseFloat(splitLocation?.[0]),
      lng: parseFloat(splitLocation?.[1]),
    };
  }

  return {
    lat: LAT,
    lng: LNG,
  };
};

export default getMapApiKey;
