import { config } from '../config';
import { supabase } from './supabaseClient';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: any;
}

// ── Token cache: avoid calling supabase.auth.getSession() on every request ──
let _cachedToken: string | null = null;
let _tokenExpiry = 0;
const TOKEN_TTL_MS = 55_000; // refresh 5 s before the typical 60 s JWT window

// Subscribe to Supabase auth state changes to guarantee token is always current
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    _cachedToken = session?.access_token ?? null;
    _tokenExpiry = session?.expires_at ? session.expires_at * 1000 - 10000 : Date.now() + TOKEN_TTL_MS;
  });
}

async function getAuthToken(): Promise<string | null> {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken;
  }
  const { data } = await supabase.auth.getSession();
  _cachedToken = data?.session?.access_token ?? null;
  _tokenExpiry = data?.session?.expires_at ? data.session.expires_at * 1000 - 10000 : now + TOKEN_TTL_MS;
  return _cachedToken;
}

/** Call this whenever the user signs in / out to bust the cache immediately. */
export function clearTokenCache() {
  _cachedToken = null;
  _tokenExpiry = 0;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, body, ...customConfig } = options;

  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Construct URL with query params
  let url = `${config.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const fetchConfig: RequestInit = {
    ...customConfig,
    headers,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  };

  const response = await fetch(url, fetchConfig);

  // If the server says our token is expired, bust the cache and retry once
  if (response.status === 401) {
    clearTokenCache();
    const freshToken = await getAuthToken();
    if (freshToken && freshToken !== token) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      const retryResponse = await fetch(url, { ...fetchConfig, headers });
      return handleResponse<T>(retryResponse);
    }
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = 'An API error occurred';
    if (Array.isArray(data?.detail)) {
      errorMessage = data.detail.map((e: any) => `${e.loc?.join('.')} ${e.msg}`).join(', ');
    } else if (typeof data?.detail === 'string') {
      errorMessage = data.detail;
    } else if (data?.message) {
      errorMessage = data.message;
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}
