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
    const res = await fetch(this.base + path, {
      method,
      headers: opts.headers || this.headers(opts.raw ? {} : {}),
      body: body == null ? null : (opts.raw ? body : JSON.stringify(body)),
    });
    const ct = res.headers.get('content-type') || '';
    let data;
    if (ct.includes('application/json')) data = await res.json();
    else if (ct.includes('application/pdf')) data = await res.blob();
    else data = await res.text();
    if (!res.ok) {
      const msg = (data && data.msg) ? data.msg : (typeof data === 'string' ? data : res.statusText);
      throw new Error(msg || ('HTTP ' + res.status));
    }
    return data;
  },
  get(path, opts) { return this.request('GET', path, null, opts); },
  post(path, body, opts) { return this.request('POST', path, body, opts); },
  patch(path, body, opts) { return this.request('PATCH', path, body, opts); },
  put(path, body, opts) { return this.request('PUT', path, body, opts); },
  del(path, opts) { return this.request('DELETE', path, null, opts); },
};