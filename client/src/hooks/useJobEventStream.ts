import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useJobEventStream(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') {
      return undefined;
    }

    const source = new EventSource('/api/events/stream');

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['job'] });
    };

    source.addEventListener('job', invalidate);
    source.addEventListener('queue', invalidate);

    source.onerror = () => {
      // Browser will reconnect automatically; keep UI usable via polling fallback.
    };

    return () => {
      source.close();
    };
  }, [enabled, queryClient]);
}
