import { openDB } from 'idb';
import axios from 'axios';

const DB_NAME = 'ner_logistics_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pendingReports';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://sih-v23m.onrender.com/api/v1';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'clientUuid' });
          store.createIndex('capturedAt', 'capturedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueuePendingReport(reportData) {
  const db = await getDB();
  const reportWithMeta = {
    ...reportData,
    clientUuid: reportData.clientUuid || `INC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    capturedAt: reportData.capturedAt || new Date().toISOString(),
    syncStatus: 'pending'
  };
  await db.put(STORE_NAME, reportWithMeta);
  console.log('[OfflineSync] Incident report enqueued in IndexedDB:', reportWithMeta.clientUuid);
  return reportWithMeta;
}

export async function getPendingReports() {
  try {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  } catch (err) {
    console.warn('[OfflineSync] Failed to read pending reports:', err);
    return [];
  }
}

export async function getPendingCount() {
  try {
    const db = await getDB();
    return await db.count(STORE_NAME);
  } catch (err) {
    return 0;
  }
}

export async function removePendingReport(clientUuid) {
  const db = await getDB();
  await db.delete(STORE_NAME, clientUuid);
  console.log('[OfflineSync] Successfully synced and removed report:', clientUuid);
}

export async function syncPendingReports(onProgress) {
  const pending = await getPendingReports();
  if (pending.length === 0) return { syncedCount: 0, failedCount: 0 };

  console.log(`[OfflineSync] Replaying ${pending.length} queued reports to server...`);
  let syncedCount = 0;
  let failedCount = 0;

  for (const report of pending) {
    try {
      await axios.post(`${API_BASE}/incidents`, report, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      await removePendingReport(report.clientUuid);
      syncedCount++;
      if (onProgress) onProgress({ syncedCount, total: pending.length, current: report });
    } catch (err) {
      console.warn(`[OfflineSync] Sync failed for ${report.clientUuid}:`, err.message);
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

// Background auto-sync on network reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Network connectivity restored. Triggering automatic sync...');
    syncPendingReports();
  });
}
