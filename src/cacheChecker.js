import packageJson from '../package.json';

const { DateTime } = require('luxon');

export function cacheChecker() {
  fetch('/meta.json')
    .then((response) => response?.json())
    .then((meta) => {
      const latestVersionDate = meta?.buildDate;
      const currentVersionDate = packageJson?.buildDate;

      const shouldForceRefresh = latestGreaterThanCurrent(
        latestVersionDate,
        currentVersionDate,
      );

      console.log(`Current Build ${getBuildDate(currentVersionDate)}`, null);
      console.log(`Latest Build ${getBuildDate(latestVersionDate)}`, null);

      if (shouldForceRefresh) {
        refreshCacheAndReload();
      }
    });
}

const refreshCacheAndReload = () => {
  if (caches) {
    // Service worker cache should be cleared with caches.delete()
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
  window.location.reload(true);
};

const latestGreaterThanCurrent = (latestDate, currentDate) => {
  const latestBuildDateTime = DateTime.fromMillis(latestDate);
  const currentBuildDateTime = DateTime.fromMillis(currentDate);

  return latestBuildDateTime > currentBuildDateTime;
};

const getBuildDate = (epoch) => {
  return DateTime.fromMillis(epoch).toLocaleString(DateTime.DATETIME_MED);
};
