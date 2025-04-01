// useOfflineQueue.tsx + Service Worker + 通知拡張
import { openDB } from 'idb';
import $ from 'jquery';
import { useEffect } from 'react';

// =========================
// IndexedDB 初期化
// =========================
const dbPromise = openDB('my-app-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('offlineRequests')) {
      db.createObjectStore('offlineRequests', {
        keyPath: 'id',
        autoIncrement: true,
      });
    }
  },
});

// =========================
// リクエスト保存
// =========================
export async function saveRequestToQueue(data: any) {
  const db = await dbPromise;
  await db.add('offlineRequests', {
    timestamp: Date.now(),
    payload: data,
  });
  console.log('リクエストを保存しました');
  showNotification('オフライン保存', 'リクエストを保存しました');
}

// =========================
// 再送処理
// =========================
export async function resendQueuedRequests() {
  const db = await dbPromise;
  const allRequests = await db.getAll('offlineRequests');
  let successCount = 0;

  for (const item of allRequests) {
    try {
      await $.ajax({
        type: 'POST',
        url: '/api/endpoint',
        data: JSON.stringify(item.payload),
        contentType: 'application/json',
      });
      await db.delete('offlineRequests', item.id);
      console.log(`再送成功: ID=${item.id}`);
      successCount++;
    } catch (err) {
      console.log(`再送失敗: ID=${item.id}`, err);
    }
  }

  if (successCount > 0) {
    showNotification('オンライン復帰', `${successCount} 件のリクエストを再送信しました`);
  }
}

// =========================
// Reactフックで監視
// =========================
export function useOfflineQueue() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('オンライン復帰を検知、再送を試みます');
      resendQueuedRequests();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('Service Worker 登録成功:', reg.scope);
      }).catch(err => {
        console.warn('Service Worker 登録失敗:', err);
      });
    }
  }, []);
}

// =========================
// 通知表示
// =========================
async function showNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, { body });
    }
  }
}
