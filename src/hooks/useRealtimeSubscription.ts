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

    // Listen for FCM push notification updates
    const handleUpdate = (e: Event) => {
      // (Optional) e.detail can be checked to see if it matches the current tableName
      onUpdateRef.current();
    };

    window.addEventListener('realtime-update', handleUpdate);

    return () => {
      window.removeEventListener('realtime-update', handleUpdate);
    };
  }, [tableName, enabled]);
}
