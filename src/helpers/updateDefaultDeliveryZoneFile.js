// src/utils/indexedDbUtils.js
import { openDB } from 'idb';

const DB_NAME = 'DeliveryZoneDB';
const STORE_NAME = 'defaultDeliveryZone';

// Initialize the database
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
};

// Save data to IndexedDB
export const saveData = async (data) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.add({ data });
  await tx.done;
};

// Load data from IndexedDB
export const loadData = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const allData = await store.getAll();
  await tx.done;
  return allData.map((entry) => entry?.data);
};

// Update data in IndexedDB
export const updateData = async (newData) => {
  const existingData = await loadData();
  const updatedData = [...existingData, ...newData];
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  await Promise.all(updatedData.map((data) => store.add({ data })));
  await tx.done;
};

export const defaultDeliveryZone = await loadData();
