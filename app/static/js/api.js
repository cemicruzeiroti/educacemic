const API = {
  base: '', // same origin
  token: localStorage.getItem('token') || '',
  setToken(t) { this.token = t; localStorage.setItem('token', t); },
  clearToken() { this.token = ''; localStorage.removeItem('token'); },
  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (this.token) h['Authorization'] = 'Bearer ' + this.token;
    return h;
  },
  async request(method, path, body, opts = {}) {
    const url = this.base + path;
    const fullUrl = this.base + path;
    const start = performance.now();
    console.log(`%c🌐 API ${method} ${path}`, 'color: #0066cc; font-weight: bold;');
    if (body && opts.raw !== true) console.log('   payload:', body);
    try {
      const res = await fetch(url, {
        method,
        headers: opts.headers || this.headers(opts.raw ? {} : {}),
        body: body == null ? null : (opts.raw ? body : JSON.stringify(body)),
      });
      const elapsed = (performance.now() - start).toFixed(0);
      const ct = res.headers.get('content-type') || '';
      let data;
      if (ct.includes('application/json')) data = await res.json();
      else if (ct.includes('application/pdf')) data = await res.blob();
      else data = await res.text();
      if (!res.ok) {
        const msg = (data && data.msg) ? data.msg : (typeof data === 'string' ? data : res.statusText);
        console.log(`%c🌐 API ${method} ${path} → ${res.status} (${elapsed}ms)`, 'color: #d00; font-weight: bold;');
        console.log('   error:', msg);
        if (res.status === 401) {
          API.clearToken();
          if (typeof clearAuth === 'function') clearAuth();
          toast('Sessão expirada. Faça login novamente.', false);
          return;
        }
        throw new Error(msg || ('HTTP ' + res.status));
      }
      console.log(`%c🌐 API ${method} ${path} → ${res.status} (${elapsed}ms)`, 'color: #0a0; font-weight: bold;');
      if (data && typeof data === 'object' && !Array.isArray(data)) console.log('   response keys:', Object.keys(data));
      return data;
    } catch (e) {
      const elapsed = (performance.now() - start).toFixed(0);
      console.log(`%c🌐 API ${method} ${path} → ERROR (${elapsed}ms)`, 'color: #d00; font-weight: bold;');
      console.log('   error:', e.message);
      throw e;
    }
  },
  get(path, opts) { return this.request('GET', path, null, opts); },
  post(path, body, opts) { return this.request('POST', path, body, opts); },
  patch(path, body, opts) { return this.request('PATCH', path, body, opts); },
  put(path, body, opts) { return this.request('PUT', path, body, opts); },
  del(path, opts) { return this.request('DELETE', path, null, opts); },
};