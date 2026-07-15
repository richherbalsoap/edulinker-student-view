// Cloudflare Worker API wrapper replacing apiClient client
const WORKER_URL = import.meta.env.VITE_WORKER_URL || "https://edulinker-worker.dominatorenterprise04.workers.dev";

// Helper: Get JWT token from localStorage
const getAuthToken = () => localStorage.getItem('edulinker_admin_token');

// Helper: Parse JWT payload
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

class ApiQueryBuilder {
  private tableName: string;
  private method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: { column: string; value: any; type: string }[] = [];
  private payload: any = null;
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = '*') {
    this.method = 'select';
    return this;
  }

  insert(data: any) {
    this.method = 'insert';
    this.payload = data;
    return this;
  }

  upsert(data: any) {
    this.method = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.method = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value, type: 'eq' });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ column, value, type: 'gte' });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ column, value, type: 'lte' });
    return this;
  }

  in(column: string, value: any[]) {
    this.filters.push({ column, value, type: 'in' });
    return this;
  }

  ilike(column: string, value: any) {
    this.filters.push({ column, value, type: 'ilike' });
    return this;
  }

  order(column: string, options?: { ascending: boolean }) {
    // Basic sorting stub
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  limit(count: number) {
    // Stub
    return this;
  }

  // Support for Promise then/catch (async/await)
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await this.execute();
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (error) {
      if (onrejected) return onrejected(error);
      throw error;
    }
  }

  private async execute() {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Determine endpoint
    // Standardize endpoint mapping
    let endpoint = `/api/${this.tableName}`;
    if (this.tableName === 'fees_reminders') {
      endpoint = '/api/fees';
    }

    const idFilter = this.filters.find(f => f.column === 'id' && f.type === 'eq');

    let url = `${WORKER_URL}${endpoint}`;
    let method = 'GET';
    let body = null;

    if (this.method === 'select') {
      method = 'GET';
      // Append query params
      const params = new URLSearchParams();
      this.filters.forEach(f => {
        params.append(f.column, String(f.value));
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    } else if (this.method === 'insert') {
      method = 'POST';
      body = JSON.stringify(this.payload);
    } else if (this.method === 'update') {
      method = 'PUT';
      if (idFilter) {
        url += `/${idFilter.value}`;
      }
      body = JSON.stringify(this.payload);
    } else if (this.method === 'delete') {
      method = 'DELETE';
      if (idFilter) {
        url += `/${idFilter.value}`;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers,
        body
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { data: null, error: new Error(errData.error || 'Request failed') };
      }

      let data = await res.json();
      if (this.isSingle && Array.isArray(data)) {
        data = data[0] || null;
      }
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  }
}

// Emulate client structure
export const apiClient = {
  from(tableName: string) {
    return new ApiQueryBuilder(tableName);
  },

  // Mock RPC functions calling the API
  async rpc(fnName: string, args: any) {
    if (fnName === 'upsert_school_for_clerk_user') {
      // Return user's school_id
      const token = getAuthToken();
      if (!token) return { data: null, error: new Error('Unauthorized') };
      const payload = parseJwt(token);
      return { data: payload?.schoolId || null, error: null };
    }
    return { data: null, error: new Error(`RPC ${fnName} not implemented`) };
  },

  // Mock edge functions service
  functions: {
    async invoke(fnName: string, options?: any) {
      console.log(`Invoking mock edge function: ${fnName}`, options);
      return { data: { success: true }, error: null };
    }
  },

  // Mock auth service
  auth: {
    async signInWithPassword({ email, password }: any) {
      try {
        const res = await fetch(`${WORKER_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        if (!res.ok) {
          return { data: { user: null }, error: new Error(result.error || 'Login failed') };
        }
        localStorage.setItem('edulinker_admin_token', result.token);
        authListeners.forEach(listener => listener('SIGNED_IN', this.getSessionSync()));
        return {
          data: {
            user: { id: result.user.id, email: result.user.email, email_confirmed_at: new Date().toISOString() }
          },
          error: null
        };
      } catch (e: any) {
        return { data: { user: null }, error: e };
      }
    },

    async signUp({ email, password, options }: any) {
      try {
        const schoolName = options?.data?.school_name || "My School";
        const res = await fetch(`${WORKER_URL}/api/admin/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, schoolName })
        });
        const result = await res.json();
        if (!res.ok) {
          return { data: { user: null }, error: new Error(result.error || 'Signup failed') };
        }
        // Save token (it might be null until verified, but we generate it for convenience)
        if (result.token) {
          localStorage.setItem('edulinker_admin_token', result.token);
        }
        authListeners.forEach(listener => listener('SIGNED_UP', this.getSessionSync()));
        return {
          data: {
            // Set email_confirmed_at to new Date().toISOString() so they can login immediately
            user: { id: result.user.id, email: result.user.email, email_confirmed_at: new Date().toISOString() }
          },
          error: null
        };
      } catch (e: any) {
        return { data: { user: null }, error: e };
      }
    },

    async signOut() {
      localStorage.removeItem('edulinker_admin_token');
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
      return { error: null };
    },

    getSessionSync() {
      const token = getAuthToken();
      if (!token) return null;
      const payload = parseJwt(token);
      if (!payload) return null;
      return {
        access_token: token,
        user: { id: payload.userId, email: payload.email, email_confirmed_at: new Date().toISOString() }
      };
    },

    async getSession() {
      const session = this.getSessionSync();
      return { data: { session }, error: null };
    },

    async getUser() {
      const session = this.getSessionSync();
      return { data: { user: session?.user || null }, error: null };
    },

    async resetPasswordForEmail(email: string, options?: any) {
      try {
        const res = await fetch(`${WORKER_URL}/api/admin/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const result = await res.json();
        if (!res.ok) return { error: new Error(result.error || 'Forgot password request failed') };
        return { data: {}, error: null };
      } catch (e: any) {
        return { error: e };
      }
    },

    async updateUser({ password }: any) {
      try {
        const token = getAuthToken();
        const res = await fetch(`${WORKER_URL}/api/admin/update-user`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password })
        });
        const result = await res.json();
        if (!res.ok) return { data: null, error: new Error(result.error || 'Password update failed') };
        return { data: { user: this.getSessionSync()?.user }, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.push(callback);
      const session = this.getSessionSync();
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      return {
        data: {
          subscription: {
            unsubscribe() {
              const index = authListeners.indexOf(callback);
              if (index !== -1) authListeners.splice(index, 1);
            }
          }
        }
      };
    }
  },

  // Mock Storage for R2
  storage: {
    from(bucketName: string) {
      return {
        async upload(path: string, file: File, options?: any) {
          try {
            const formData = new FormData();
            formData.append('file', file, file.name);
            formData.append('path', path);

            const res = await fetch(`${WORKER_URL}/api/upload`, {
              method: 'POST',
              body: formData
            });

            if (!res.ok) {
              const result = await res.json();
              return { data: null, error: new Error(result.error || 'Upload failed') };
            }

            const result = await res.json();
            return { data: { path: result.key, publicUrl: `${WORKER_URL}${result.url}` }, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        },

        getPublicUrl(path: string) {
          return { data: { publicUrl: `${WORKER_URL}/api/files/${path}` } };
        }
      };
    }
  }
};

const authListeners: ((event: string, session: any) => void)[] = [];
