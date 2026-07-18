import { useEffect, useRef } from 'react';

/**
 * Realtime sync using FCM events.
 * Calls `onUpdate` with a debounce to prevent spamming requests.
 */
export function useRealtimeSubscription(
  tableName: string,
  onUpdate: () => void,
  enabled: boolean = true
) {
  const onUpdateRef = useRef(onUpdate);
  const timeoutRef = useRef<number | null>(null);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    // Listen for FCM push notification updates with debounce
    const handleUpdate = (e: Event) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        onUpdateRef.current();
      }, 1500); // 1.5 second debounce
    };

    window.addEventListener('realtime-update', handleUpdate);

    return () => {
      window.removeEventListener('realtime-update', handleUpdate);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [tableName, enabled]);
}
