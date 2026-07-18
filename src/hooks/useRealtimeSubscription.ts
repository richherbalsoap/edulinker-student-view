import { useEffect, useRef } from 'react';

/**
 * Polling alternative to realtime changes.
 * Calls `onUpdate` periodically.
 */
export function useRealtimeSubscription(
  tableName: string,
  onUpdate: () => void,
  enabled: boolean = true
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    // Fetch every 30 seconds to save Cloudflare requests
    const interval = window.setInterval(() => {
      onUpdateRef.current();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [tableName, enabled]);
}
