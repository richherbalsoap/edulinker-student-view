import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to realtime changes on a Supabase table.
 * Calls `onUpdate` whenever an INSERT, UPDATE, or DELETE happens.
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

    const channel = supabase
      .channel(`${tableName}-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => {
          onUpdateRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, enabled]);
}
