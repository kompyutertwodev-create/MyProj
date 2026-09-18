export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message ?? 'The request could not be completed.');
    this.name = 'ApiClientError';
    this.status = status;
    this.code = payload.code ?? 'API_ERROR';
    this.details = payload.details;
  }
}

export interface HttpClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api').replace(
      /\/$/,
      ''
    );
    this.fetcher = options.fetcher ?? fetch;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}/${path.replace(/^\//, '')}`, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
    });

    const body = (await response.json().catch(() => null)) as
      { data?: T; error?: ApiErrorPayload } | T | null;

    if (!response.ok) {
      const errorPayload = body && typeof body === 'object' && 'error' in body ? body.error : {};
      throw new ApiClientError(response.status, errorPayload ?? {});
    }

    if (body && typeof body === 'object' && 'data' in body) {
      return body.data as T;
    }
    return body as T;
  }

  get<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
}

export const apiClient = new HttpClient();
