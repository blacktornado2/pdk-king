import { useEffect, useRef, useState } from 'react';
import { jobsApi } from '../services/api';
import type { Job } from '../types';

export function useJobPolling(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let active = true;

    const poll = async () => {
      try {
        const { data } = await jobsApi.status(jobId);
        if (!active) return;
        setJob(data);

        if (data.status === 'PENDING' || data.status === 'PROCESSING') {
          timerRef.current = setTimeout(poll, 1500);
        }
      } catch {
        if (active) setError('Failed to fetch job status');
      }
    };

    poll();

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jobId]);

  return { job, error };
}
