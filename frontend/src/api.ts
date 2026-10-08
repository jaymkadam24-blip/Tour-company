import { Application, ApplicationStats, SystemSettings, User } from './types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('tour_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchApplications(params?: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: string;
}): Promise<{ applications: Application[]; stats: ApplicationStats }> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.sort) query.append('sort', params.sort);
  if (params?.order) query.append('order', params.order);

  const res = await fetch(`${API_BASE}/applications?${query.toString()}`, {
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch applications');
  return { applications: json.data, stats: json.stats };
}

export async function fetchApplicationById(id: string | number): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch application');
  return json.data;
}

export async function updateApplication(
  id: number | string,
  updates: Partial<Application>
): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(updates)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update application');
  return json.data;
}

export async function deleteApplication(id: number | string): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete application');
}

export async function reExtractApplication(id: number | string): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}/re-extract`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to re-extract application');
  return json.data;
}

export async function createApplication(data: Partial<Application> & { raw_email_text?: string }): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create application');
  return json.data;
}

export async function simulateEmailIngestion(data: {
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
}): Promise<{ status: string; applicationId?: string; application?: Application }> {
  const res = await fetch(`${API_BASE}/emails/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok && !json.success) {
    throw new Error(json.message || json.error || 'Failed to simulate email');
  }
  return { status: json.result?.status, applicationId: json.result?.applicationId, application: json.application };
}

export async function triggerEmailSync(): Promise<{ processedCount: number; duplicatesCount: number; errors: string[] }> {
  const res = await fetch(`${API_BASE}/emails/sync`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to sync emails');
  return json.result;
}

export async function fetchEmailSyncStatus(): Promise<{ gmail_connected: boolean; gmail_email: string; last_sync: unknown }> {
  const res = await fetch(`${API_BASE}/emails/status`, {
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch email status');
  return json.data;
}

export function downloadExcelExport(params?: { status?: string; search?: string; startDate?: string; endDate?: string }) {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const url = `${API_BASE}/export/excel?${query.toString()}`;
  window.open(url, '_blank');
}

export async function fetchSettings(): Promise<SystemSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    headers: { ...getAuthHeader() }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch settings');
  return json.data;
}

export async function saveSettings(settings: Partial<SystemSettings>): Promise<void> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(settings)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save settings');
}

export async function login(username: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Login failed');
  localStorage.setItem('tour_admin_token', json.token);
  return { user: json.user, token: json.token };
}

export async function verifyAuth(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    const json = await res.json();
    if (json.success) return json.user;
    return null;
  } catch {
    return null;
  }
}
