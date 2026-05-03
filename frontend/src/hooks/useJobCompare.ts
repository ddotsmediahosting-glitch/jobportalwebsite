import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'uaejobs_compare';
const MAX_JOBS = 3;

export interface CompareItem {
  id: string;
  slug: string;
  title: string;
}

function read(): CompareItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompareItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CompareItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  // Notify other components in the same tab
  window.dispatchEvent(new CustomEvent('uaejobs:compare-changed'));
}

export function useJobCompare() {
  const [items, setItems] = useState<CompareItem[]>(read);

  // Sync across tabs (storage event) AND across components in the same tab (custom event)
  useEffect(() => {
    const onChange = () => setItems(read());
    window.addEventListener('storage', onChange);
    window.addEventListener('uaejobs:compare-changed', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('uaejobs:compare-changed', onChange);
    };
  }, []);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const isFull = items.length >= MAX_JOBS;

  const add = useCallback((item: CompareItem): boolean => {
    const current = read();
    if (current.some((i) => i.id === item.id)) return false;
    if (current.length >= MAX_JOBS) return false;
    write([...current, item]);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((i) => i.id !== id));
  }, []);

  const toggle = useCallback((item: CompareItem): { added: boolean; full: boolean } => {
    const current = read();
    if (current.some((i) => i.id === item.id)) {
      write(current.filter((i) => i.id !== item.id));
      return { added: false, full: false };
    }
    if (current.length >= MAX_JOBS) return { added: false, full: true };
    write([...current, item]);
    return { added: true, full: false };
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, has, isFull, add, remove, toggle, clear, max: MAX_JOBS };
}
