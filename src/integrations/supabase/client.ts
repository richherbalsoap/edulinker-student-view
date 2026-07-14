// Cloudflare Worker API wrapper replacing Supabase client for Student View
const WORKER_URL = "https://edulinker-worker.dominatorenterprise04.workers.dev";

// Helper: Get JWT token from localStorage
const getStudentToken = () => localStorage.getItem('edulinker_student_token');

class SupabaseQueryBuilder {
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

  ilike(column: string, value: any) {
    this.filters.push({ column, value, type: 'ilike' });
    return this;
  }

  order(column: string, options?: { ascending: boolean }) {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

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
    const token = getStudentToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

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

      // Intercept students query to extract and save the student JWT token
      if (this.tableName === 'students' && data) {
        const rows = Array.isArray(data) ? data : [data];
        rows.forEach(r => {
          if (r && r.token) {
            localStorage.setItem('edulinker_student_token', r.token);
          }
        });
      }

      if (this.isSingle && Array.isArray(data)) {
        data = data[0] || null;
      }
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e };
    }
  }
}

export const supabase = {
  from(tableName: string) {
    return new SupabaseQueryBuilder(tableName);
  },

  auth: {
    async signOut() {
      localStorage.removeItem('edulinker_student_token');
      return { error: null };
    }
  },

  storage: {
    from(bucketName: string) {
      return {
        async upload(path: string, file: File, options?: any) {
          try {
            const formData = new FormData();
            formData.append('file', file, file.name);

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
