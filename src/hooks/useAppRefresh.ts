import { useEffect, useRef } from 'react';

/**
 * Subscribe to the global "app-refresh" event dispatched by the header refresh button.
 * The provided callback (typically a data fetcher) will be invoked whenever the user
 * taps the Refresh icon in the header.
 */
export function useAppRefresh(onRefresh: () => void) {
  const ref = useRef(onRefresh);
  ref.current = onRefresh;

  useEffect(() => {
    const handler = () => {
      try { ref.current(); } catch { /* noop */ }
    };
    window.addEventListener('app-refresh', handler);
    return () => window.removeEventListener('app-refresh', handler);
  }, []);
}
