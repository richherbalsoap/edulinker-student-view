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

    // Fetch every 10 seconds
    const interval = window.setInterval(() => {
      onUpdateRef.current();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [tableName, enabled]);
}
