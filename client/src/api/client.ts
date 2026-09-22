import type { CreateJobPayload, Job, JobListParams, PaginatedJobs, Stats } from '../types/job';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body?.error?.message ?? 'Request failed', response.status, body?.error?.details);
  }
  return body as T;
}

function toQuery(params: JobListParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const api = {
  getJobs: (params: JobListParams = {}) =>
    request<PaginatedJobs>(`/api/jobs${toQuery(params)}`),

  getJob: async (id: string) => {
    const body = await request<{ data: Job }>(`/api/jobs/${id}`);
    return body.data;
  },

  createJob: async (payload: CreateJobPayload) => {
    const body = await request<{ data: Job }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return body.data;
  },

  deleteJob: (id: string) => request<unknown>(`/api/jobs/${id}`, { method: 'DELETE' }),

  retryJob: async (id: string) => {
    const body = await request<{ data: Job }>(`/api/jobs/${id}/retry`, { method: 'POST' });
    return body.data;
  },

  getStats: async () => {
    const body = await request<{ data: Stats }>('/api/stats');
    return body.data;
  },

  getHealth: () => request<{ status: string; uptimeSec: number }>('/api/health'),
};
