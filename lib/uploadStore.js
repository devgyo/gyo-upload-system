'use client';

const COUNT_KEY = 'uploadCount';
const DATE_KEY = 'uploadDate';

const todayStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const withStorage = (fn) => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return fn(window.localStorage);
};

export function resetIfNewDay() {
  return withStorage((storage) => {
    const current = todayStamp();
    const storedDate = storage.getItem(DATE_KEY);
    if (storedDate !== current) {
      storage.setItem(DATE_KEY, current);
      storage.setItem(COUNT_KEY, '0');
    }
  });
}

export function getUploadCount() {
  return withStorage((storage) => {
    resetIfNewDay();
    const count = parseInt(storage.getItem(COUNT_KEY) || '0', 10);
    return Number.isNaN(count) ? 0 : count;
  }) ?? 0;
}

export function incrementUploadCount(n = 1) {
  return withStorage((storage) => {
    resetIfNewDay();
    const current = getUploadCount();
    const next = current + n;
    storage.setItem(COUNT_KEY, String(next));
    return next;
  }) ?? 0;
}
