// Theme

(function initTheme() {

  const saved = localStorage.getItem('theme') || 'light';

  if (saved === 'dark') document.documentElement.classList.add('dark');

})();



function toggleTheme() {

  const html = document.documentElement;

  html.classList.toggle('dark');

  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');

}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);



// Date formatting (dd/mm/yyyy HH:MM)

function formatDateTime(iso) {

  if (!iso) return '';

  const d = new Date(iso);

  if (isNaN(d.getTime())) return iso;

  const dd = String(d.getDate()).padStart(2, '0');

  const mm = String(d.getMonth() + 1).padStart(2, '0');

  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, '0');

  const min = String(d.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;

}



function skeletonRow(cols) {

  return '<tr class="animate-pulse"><td colspan="' + cols + '" class="p-4"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div></td></tr>';

}



function statusLabel(s) {

  if (s === 'pending') return 'pendente';

  if (s === 'approved') return 'aprovado';

  if (s === 'rejected') return 'rejeitado';

  return s;

}

function statusBadgeClass(s) {

  if (s === 'pending') return 'bg-yellow-100 text-yellow-700';

  if (s === 'approved') return 'bg-green-100 text-green-700';

  if (s === 'rejected') return 'bg-red-100 text-red-700';

  return 'bg-gray-100 text-gray-700';

}



// Toast

function toast(msg, ok = true) {

  const t = document.getElementById('toast');

  t.textContent = msg;

  t.className = 'fixed bottom-4 right-4 px-4 py-2 rounded shadow text-white ' + (ok ? 'bg-green-600' : 'bg-red-600');

  t.classList.remove('hidden');

  setTimeout(() => t.classList.add('hidden'), 3000);

}



// Loading spinner on buttons

function setLoading(btn, loading) {

  if (!btn) return;

  btn.disabled = loading;

  if (loading) {

    btn.classList.add('opacity-70', 'cursor-not-allowed');

    // esconde ícones existentes enquanto carrega

    btn.querySelectorAll('i, svg').forEach(el => el.classList.add('hidden'));

    if (!btn.querySelector('.btn-spinner')) {

      const sp = document.createElement('span');

      sp.className = 'btn-spinner animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent inline-block';

      btn.prepend(sp);

    }

  } else {

    btn.classList.remove('opacity-70', 'cursor-not-allowed');

    const sp = btn.querySelector('.btn-spinner');

    if (sp) sp.remove();

    btn.querySelectorAll('i, svg').forEach(el => el.classList.remove('hidden'));

  }

}



// Modal

function openModal(html) {

  const m = document.getElementById('modal');

  document.getElementById('modalBody').innerHTML = html;

  m.classList.remove('hidden');

  m.classList.add('flex');

  if (window.lucide) lucide.createIcons();

}

function closeModal() {

  const m = document.getElementById('modal');

  m.classList.add('hidden');

  m.classList.remove('flex');

}

function confirmModal(message, onConfirm) {

  openModal(`

    <p class="mb-4">${message}</p>

    <div class="flex gap-2 justify-center">

      <button id="modalCancel" class="px-4 py-2 rounded border surface">Cancelar</button>

      <button id="modalConfirm" class="btn-primary px-4 py-2 rounded">Confirmar</button>

    </div>

  `);

  document.getElementById('modalCancel').onclick = closeModal;

  document.getElementById('modalConfirm').onclick = async () => {

    closeModal();

    await onConfirm();

  };

}

function successModal(message) {

  openModal(`

    <div class="flex flex-col items-center gap-3">

      <i data-lucide="check-circle" class="w-12 h-12 text-green-500"></i>

      <p class="font-medium">${message}</p>

    </div>

  `);

  setTimeout(() => closeModal(), 1000);

}



// View switching

function showView(name, updateHash = true) {

  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

  const el = document.getElementById('view-' + name);

  if (el) el.classList.remove('hidden');

  document.querySelectorAll('.navbtn').forEach(b => {

    if (b.dataset.view === name) b.classList.add('nav-active');

    else b.classList.remove('nav-active');

  });

  if (updateHash && name && name !== 'auth') {

    if (location.hash !== '#' + name) location.hash = name;

  } else if (updateHash && name === 'auth') {

    if (location.hash) location.hash = '';

  }

  if (name === 'students') { loadStudents(); if (window.lucide) lucide.createIcons(); }

  if (name === 'occurrences') loadOccurrences();

  if (name === 'dashboard') loadDashboard();

  if (name === 'admin') { loadRequests(); }

  if (name === 'classes') {

    if (window.lucide) lucide.createIcons();

    populateClassTurmas();

    const sel = document.getElementById('className');

    if (sel) sel.addEventListener('change', toggleClassButtons);

  }

}

document.querySelectorAll('.navbtn').forEach(b => {

  b.addEventListener('click', () => { location.hash = b.dataset.view; });

});



// Auth state

function currentUser() {

  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }

}

function canRemoveOccurrence(o) {

  const u = currentUser();

  if (!u) return false;

  if (u.cargo === 'admin') return true;

  return o.registered_by_user_id === u.id;

}

function setAuth(token, user) {

  API.setToken(token);

  localStorage.setItem('user', JSON.stringify(user));

  updateAuthUI();

}

function clearAuth() {

  API.clearToken();

  localStorage.removeItem('user');

  updateAuthUI();

}

function updateAuthUI() {

  const user = currentUser();

  const nav = document.getElementById('mainNav');

  const logout = document.getElementById('logoutBtn');

  const who = document.getElementById('whoami');

  if (user && API.token) {

    nav.classList.remove('hidden');

    logout.classList.remove('hidden');

    who.textContent = `${user.username} (${user.cargo})`;

    const allowed = {

      admin: ['dashboard','students','occurrences','classes','admin'],

      professor: ['occurrences'],

      soe: ['occurrences'],

      coordenador: ['dashboard','students','occurrences','classes'],

      supervisor: ['dashboard','students','occurrences','classes'],

      vicediretor: ['dashboard','students','occurrences','classes'],

      diretor: ['dashboard','students','occurrences','classes'],

    }[user.cargo] || ['occurrences'];

    document.querySelectorAll('.navbtn').forEach(b => {

      if (allowed.includes(b.dataset.view)) b.classList.remove('hidden');

      else b.classList.add('hidden');

    });

    const hashView = (location.hash || '').replace('#', '');

    const defaultView = user.cargo === 'admin' ? 'admin' : (allowed.includes('occurrences') ? 'occurrences' : allowed[0]);

    const initial = allowed.includes(hashView) ? hashView : defaultView;

    loadPenalties();

    showView(initial, false);

    if (!allowed.includes(hashView)) {

      window._settingHash = true;

      location.hash = initial;

    }

  } else {

    nav.classList.add('hidden');

    logout.classList.add('hidden');

    who.textContent = '';

    showView('auth');

  }

}

document.getElementById('logoutBtn').addEventListener('click', () => { clearAuth(); toast('Saiu'); });



// Login

document.getElementById('loginForm').addEventListener('submit', async (e) => {

  e.preventDefault();

  const f = new FormData(e.target);

  const msg = document.getElementById('loginMsg');

  msg.textContent = '';

  const btn = document.getElementById('loginBtn');

  setLoading(btn, true);

  try {

    const data = await API.post('/api/auth/login', {

      username: f.get('username'),

      password: f.get('password'),

    });

    setAuth(data.access_token, data.user);

    toast('Login realizado');

  } catch (err) {

    msg.textContent = err.message;

  } finally {

    setLoading(btn, false);

  }

});



// Dashboard

async function loadDashboard() {

  try {

    if (!allStudents || !allStudents.length) {

      allStudents = await API.get('/api/students');

    }

    if (!allOccurrences || !allOccurrences.length) {

      allOccurrences = await API.get('/api/occurrences');

    }

    const classes = new Set((allStudents || []).map(s => s.turma));

    document.getElementById('statStudents').textContent = allStudents.length;

    document.getElementById('statOcc').textContent = allOccurrences.length;

    document.getElementById('statClasses').textContent = classes.size;

  } catch (e) { /* ignore */ }

}



// Students

let occPage = 1;

let userPage = 1;



function renderPagination(containerId, page, totalPages, onPage) {

  const el = document.getElementById(containerId);

  if (!el) return;

  if (totalPages <= 1) { el.innerHTML = ''; return; }

  el.innerHTML = `

    <button ${page <= 1 ? 'disabled' : ''} onclick="(${onPage.toString()})(${page - 1})" class="px-3 py-1 rounded border surface ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">Anterior</button>

    <span class="text-sm text-muted">Página ${page} de ${totalPages}</span>

    <button ${page >= totalPages ? 'disabled' : ''} onclick="(${onPage.toString()})(${page + 1})" class="px-3 py-1 rounded border surface ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}">Próxima</button>

  `;

}



let allStudents = [];

let studentSort = { key: 'nome', dir: 'asc' };

let studentPage = 1;

const PAGE_SIZE = 5;

let _studentsInitDone = false;

async function loadStudents(reload) {

  studentPage = 1;

  const tbody = document.getElementById('studentsTable');

  if (!_studentsInitDone || reload) {

    if (tbody) tbody.innerHTML = skeletonRow(4);

    try {

      const data = await API.get('/api/students');

      allStudents = data;

      _studentsInitDone = true;

    } catch (e) { toast(e.message, false); }

  }

  renderStudents();

}

window.toggleStudentSort = (key) => {

  if (studentSort.key === key) studentSort.dir = studentSort.dir === 'asc' ? 'desc' : 'asc';

  else { studentSort.key = key; studentSort.dir = 'asc'; }

  renderStudents(true);

};

function renderStudents(resetPage) {

  if (resetPage) studentPage = 1;

  const q = (document.getElementById('studentSearch').value || '').toLowerCase().trim();

  let data = [...allStudents];

  if (q) data = data.filter(s => s.nome.toLowerCase().includes(q) || String(s.turma).toLowerCase().includes(q));

  const key = studentSort.key;

  const dir = studentSort.dir === 'asc' ? 1 : -1;

  data.sort((a,b) => {

    if (key === 'nome') return a.nome.localeCompare(b.nome) * dir;

    if (key === 'turma') return String(a.turma).localeCompare(String(b.turma)) * dir;

    return 0;

  });

  const total = data.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (studentPage > totalPages) studentPage = totalPages;

  const start = (studentPage - 1) * PAGE_SIZE;

  const pageData = data.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('studentsTable');

  tbody.innerHTML = pageData.map(s => `

    <tr class="border-t hover:bg-gray-100 dark:hover:bg-gray-700">

      <td class="p-2">${s.id}</td>

      <td class="p-2">${s.nome}</td>

      <td class="p-2">${s.turma}</td>

      <td class="p-2">${s.pontos_formativo}</td>

      <td class="p-2">

        <div class="inline-flex items-center gap-2">

          <button onclick="viewStudent(${s.id})" title="Ver relatório bimestral" class="inline-flex items-center gap-1 px-2 py-1 rounded border surface text-xs text-blue-600 hover:text-blue-800">

            <i data-lucide="eye" class="w-4 h-4"></i>

            Ver

          </button>

          <button onclick="downloadStudentPdf(${s.id})" title="Gerar relatório de ocorrências" class="inline-flex items-center gap-1 px-2 py-1 rounded border surface text-xs text-blue-600 hover:text-blue-800">

            <i data-lucide="file-text" class="w-4 h-4"></i>

            PDF

          </button>

          <button onclick="removeStudent(${s.id})" title="Remover Estudante" class="text-red-600 hover:text-red-800">

            <i data-lucide="minus-circle" class="w-4 h-4"></i>

          </button>

        </div>

      </td>

    </tr>

  `).join('');

  if (window.lucide) lucide.createIcons();

  renderPagination('studentsPagination', studentPage, totalPages, (p) => { studentPage = p; renderStudents(false); });

}

document.getElementById('studentSearch').addEventListener('input', () => renderStudents(true));



window.removeStudent = (id) => {

  const btn = document.querySelector(`button[onclick="removeStudent(${id})"]`);

  confirmModal('Remover este aluno?', async () => {

    setLoading(btn, true);

    try {

      await API.del(`/api/students/${id}`);

      toast('Estudante removido');

      loadStudents(true);

    } catch (e) { toast(e.message, false); }

    finally { setLoading(btn, false); }

  });

};



window.editPoints = async (id, current) => {

  const v = prompt('Novo total de pontos formativos:', current);

  if (v === null) return;

  const btn = document.querySelector(`button[onclick="editPoints(${id}, ...)"]`) || null;

  setLoading(btn, true);

  try {

    await API.patch(`/api/students/${id}`, { pontos_formativo: parseFloat(v) });

    toast('Atualizado');

    loadStudents(true);

  } catch (e) { toast(e.message, false); }

  finally { setLoading(btn, false); }

};

window.downloadStudentPdf = (id) => {

  window.open(`/api/students/${id}/occurrences/pdf?token=${API.token}`, '_blank');

  // fetch with auth instead:

};



const OCC_COLOR_MAP = {

  'ATRASO': 'bg-gray-100 text-gray-700',

  'OUTROS': 'bg-gray-100 text-gray-700',

  'ADVERTENCIA': 'bg-red-100 text-red-700',

  'SUSPENSAO': 'bg-red-100 text-red-700',

  'OCORRENCIA LEVE': 'bg-yellow-100 text-yellow-700',

  'OCORRENCIA MEDIA': 'bg-orange-100 text-orange-700',

  'OCORRENCIA GRAVE': 'bg-red-100 text-red-700',

  'CELULAR': 'bg-yellow-100 text-yellow-700',

};



async function viewStudent(id) {

  currentStudentId = id;

  const btn = document.querySelector(`button[onclick="viewStudent(${id})"]`);

  setLoading(btn, true);

  try {

    // Buscar todas as ocorrencias do aluno (com bimestre)

    const res = await API.get(`/api/occurrences?student_id=${id}`);

    const allOccs = res || [];

    // Buscar dados do aluno do cache (nao existe rota GET /api/students/:id)

    const student = allStudents.find(s => s.id === id) || { nome: 'Aluno', turma: '-' };

    

    document.getElementById('studentViewNome').textContent = student.nome;

    document.getElementById('studentViewTurma').textContent = student.turma;

    document.getElementById('studentViewFoto').src = `/static/photos/${student.id}.jpg?t=` + Date.now();

    document.getElementById('studentViewFoto').onerror = function() {

      this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.nome) + '&background=random&size=512';

    };



    // Carregar datas dos bimestres se ainda nao tiverem sido carregadas

    if (!bimestreDates || Object.values(bimestreDates).every(v => !v)) {

      await loadBimestres();

    }

    // Calcular bimestre corrente baseado na data atual

    const now = new Date();

    const nowStr = now.toISOString().split('T')[0];

    let currentBim = null;

    for (let i = 1; i <= 4; i++) {

      const inicio = bimestreDates[`bimestre_${i}_inicio`];

      const fim = bimestreDates[`bimestre_${i}_fim`];

      if (inicio && fim) {

        const dIni = new Date(inicio + 'T00:00:00');

        const dFim = new Date(fim + 'T23:59:59');

        const dNow = new Date(nowStr + 'T00:00:00');

        if (dNow >= dIni && dNow <= dFim) {

          currentBim = i;

          break;

        }

      }

    }



    // Preencher checkboxes de bimestre

    const chk0 = document.getElementById('studentViewBim0');

    const chk1 = document.getElementById('studentViewBim1');

    const chk2 = document.getElementById('studentViewBim2');

    const chk3 = document.getElementById('studentViewBim3');

    const chk4 = document.getElementById('studentViewBim4');



    // Marcar todos por default, ou apenas o bimestre corrente

    if (currentBim) {

      chk0.checked = false;

      chk1.checked = currentBim === 1;

      chk2.checked = currentBim === 2;

      chk3.checked = currentBim === 3;

      chk4.checked = currentBim === 4;

    } else {

      chk0.checked = true;

      chk1.checked = false;

      chk2.checked = false;

      chk3.checked = false;

      chk4.checked = false;

    }



    // Funcao para renderizar ocorrencias filtradas pelos bimestres selecionados

    function renderOccsByBim() {

      const list = document.getElementById('studentViewOcorrencias');

      list.innerHTML = '';

      const bims = [];

      if (chk0.checked) {

        // Todos marcados - mostra todas as ocorrencias

        bims.length = 0;

      } else {

        if (chk1.checked) bims.push(1);

        if (chk2.checked) bims.push(2);

        if (chk3.checked) bims.push(3);

        if (chk4.checked) bims.push(4);

      }

      // Nenhum bimestre selecionado

      if (!chk0.checked && bims.length === 0) {

        list.innerHTML = '<div class="text-sm text-muted italic px-3 py-2">Selecione um bimestre.</div>';

        document.getElementById('studentViewTotal').textContent = 'Total de ocorrências: 0';

        return;

      }

      let filtered = allOccs;

      if (bims.length > 0) {

        filtered = allOccs.filter(o => bims.includes(o.bimestre));

      }

      if (!filtered || filtered.length === 0) {

        list.innerHTML = '<div class="text-sm text-muted italic px-3 py-2">Nenhuma ocorrência registrada</div>';

        document.getElementById('studentViewTotal').textContent = 'Total de ocorrências: 0';

        return;

      }

      // Agrupar por tipo

      const summary = {};

      filtered.forEach(o => {

        summary[o.tipo] = (summary[o.tipo] || 0) + 1;

      });

      Object.entries(summary).forEach(([tipo, qtd]) => {

        const badge = OCC_COLOR_MAP[tipo] || 'bg-gray-100 text-gray-700';

        const div = document.createElement('div');

        div.className = 'flex items-center justify-between px-3 py-2 border rounded bg-white dark:bg-gray-800';

        div.innerHTML = '<span class="text-sm">' + tipo + '</span><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ' + badge + '">' + qtd + '</span>';

        list.appendChild(div);

      });

      document.getElementById('studentViewTotal').textContent = 'Total de ocorrências: ' + filtered.length;

    }

    // Funcao para sincronizar checkbox "Todos" com os individuais

    function updateTodosCheckbox() {

      const anyChecked = chk1.checked || chk2.checked || chk3.checked || chk4.checked;

      const allChecked = chk1.checked && chk2.checked && chk3.checked && chk4.checked;

      if (anyChecked && !allChecked) {

        chk0.checked = false;

      } else if (allChecked) {

        chk0.checked = true;

      }

    }

    // Eventos de change nos checkboxes individuais

    chk1.addEventListener('change', function() {

      if (this.checked) chk0.checked = false;

      updateTodosCheckbox();

      renderOccsByBim();

    });

    chk2.addEventListener('change', function() {

      if (this.checked) chk0.checked = false;

      updateTodosCheckbox();

      renderOccsByBim();

    });

    chk3.addEventListener('change', function() {

      if (this.checked) chk0.checked = false;

      updateTodosCheckbox();

      renderOccsByBim();

    });

    chk4.addEventListener('change', function() {

      if (this.checked) chk0.checked = false;

      updateTodosCheckbox();

      renderOccsByBim();

    });

    // Evento de change no checkbox "Todos"

    chk0.addEventListener('change', function() {

      if (chk0.checked) {

        chk1.checked = true;

        chk2.checked = true;

        chk3.checked = true;

        chk4.checked = true;

      } else {

        chk1.checked = false;

        chk2.checked = false;

        chk3.checked = false;

        chk4.checked = false;

      }

      renderOccsByBim();

    });

    // Renderizar com o(s) bimestre(s) selecionado(s)

    renderOccsByBim();



    document.getElementById('studentViewModal').classList.remove('hidden');

    document.getElementById('studentViewModal').classList.add('flex');

  } catch (e) {

    toast(e.message, false);

  } finally {

    setLoading(btn, false);

  }

}let currentStudentId = null;



function closeStudentView() {

  document.getElementById('studentViewModal').classList.add('hidden');

  document.getElementById('studentViewModal').classList.remove('flex');

}



// Upload de foto: dispara automaticamente ao selecionar arquivo

document.getElementById('studentViewFotoInput').addEventListener('change', async () => {

  const input = document.getElementById('studentViewFotoInput');

  if (!input.files || input.files.length === 0) return;

  const fd = new FormData();

  fd.append('file', input.files[0]);

  const btn = document.querySelector('label[for="studentViewFotoInput"]');

  setLoading(btn, true);

  try {

    const res = await fetch(`/api/students/${currentStudentId}/photo`, {

      method: 'POST',

      headers: { 'Authorization': 'Bearer ' + API.token },

      body: fd,

    });

    if (!res.ok) {

      const data = await res.json();

      throw new Error(data.msg || 'Erro ao enviar foto');

    }

    const data = await res.json();

    toast('Foto enviada com sucesso');

    input.value = '';

    const img = document.getElementById('studentViewFoto');

    img.src = data.photo_url + '?t=' + Date.now();

  } catch (e) {

    toast(e.message, false);

  } finally {

    setLoading(btn, false);

  }

});



// create student

document.getElementById('createStudentForm').addEventListener('submit', async (e) => {

  e.preventDefault();

  const f = new FormData(e.target);

  const nome = (f.get('nome') || '').trim();

  const ano = f.get('ano');

  const letra = f.get('letra');

  if (!nome || !ano || !letra) { toast('Preencha todos os campos', false); return; }

  const turma = ano + letra;

  const btn = e.target.querySelector('button[type=submit]');

  confirmModal(`Confirmar cadastro do estudante "${nome}" na turma ${turma}?`, async () => {

    setLoading(btn, true);

    try {

      await API.post('/api/students', { nome, turma });

      e.target.reset();

      loadStudents(true);

      successModal('Estudante cadastrado com sucesso!');

    } catch (err) { toast(err.message, false); }

    finally { setLoading(btn, false); }

  });

});



// bulk

document.getElementById('bulkForm').addEventListener('submit', async (e) => {

  e.preventDefault();

  const f = new FormData(e.target);

  const file = f.get('file');

  if (!file || !file.name) { toast('Selecione um CSV', false); return; }

  if (!file.name.toLowerCase().endsWith('.csv')) { toast('Arquivo deve ser .csv', false); return; }

  if (file.size === 0) { toast('Arquivo vazio', false); return; }

  const btn = e.target.querySelector('button[type=submit]');

  setLoading(btn, true);

  const fd = new FormData();

  fd.append('file', file);

  try {

    const res = await fetch('/api/students/bulk', {

      method: 'POST',

      headers: { 'Authorization': 'Bearer ' + API.token },

      body: fd,

    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.msg || 'Erro');

    toast(`Importados: ${data.created}`);

    loadStudents(true);

  } catch (err) { toast(err.message, false); }

  finally { setLoading(btn, false); }

});



// Occurrences

let allOccurrences = [];

let _occInitDone = false;

let _penaltiesInitDone = false;

async function ensureStudents() {

  if (!allStudents || !allStudents.length) {

    try { allStudents = await API.get('/api/students'); } catch (e) { allStudents = []; }

  }

}

function turmasUnicas() {

  return [...new Set((allStudents || []).map(s => s.turma))].sort();

}

async function populateClassTurmas() {

  await ensureStudents();

  const sel = document.getElementById('className');

  if (!sel) return;

  const current = sel.value;

  sel.innerHTML = '<option value="" disabled selected>Selecione a turma</option>';

  const allOpt = document.createElement('option');

  allOpt.value = 'ALL'; allOpt.textContent = 'Todas as turmas';

  sel.appendChild(allOpt);

  turmasUnicas().forEach(t => {

    const o = document.createElement('option');

    o.value = t; o.textContent = t;

    sel.appendChild(o);

  });

  if (current) sel.value = current;

  toggleClassButtons();

}



function toggleClassButtons() {

  const val = document.getElementById('className').value;

  const occBtn = document.getElementById('loadClassOccPdf');

  if (!occBtn) return;

  if (val === 'ALL') {

    occBtn.disabled = true;

    occBtn.classList.add('opacity-50','cursor-not-allowed');

  } else {

    occBtn.disabled = false;

    occBtn.classList.remove('opacity-50','cursor-not-allowed');

  }

}



function tipoBadgeClass(tipo) {

  if (tipo === 'OCORRENCIA LEVE' || tipo === 'CELULAR') return 'bg-yellow-100 text-yellow-700';

  if (tipo === 'OCORRENCIA MEDIA') return 'bg-orange-100 text-orange-700';

  if (tipo === 'OCORRENCIA GRAVE' || tipo === 'ADVERTENCIA' || tipo === 'SUSPENSAO') return 'bg-red-100 text-red-700';

  return 'bg-gray-200 text-gray-700';

}

let OCC_PENALTY = {

  'ATRASO': 0.0, 'OUTROS': 0.0, 'ADVERTENCIA': 0.5, 'SUSPENSAO': 1.0,

  'OCORRENCIA LEVE': 0.1, 'OCORRENCIA MEDIA': 0.2, 'OCORRENCIA GRAVE': 0.3,

  'CELULAR': 0.1,

};



// Datas dos bimestres (carregadas do backend)

let bimestreDates = {

  bimestre_1_inicio: '', bimestre_1_fim: '',

  bimestre_2_inicio: '', bimestre_2_fim: '',

  bimestre_3_inicio: '', bimestre_3_fim: '',

  bimestre_4_inicio: '', bimestre_4_fim: '',

};



function calcularBimestreFrontend(dataHoraStr) {

  if (!dataHoraStr || !bimestreDates) return null;

  try {

    const data = new Date(dataHoraStr + 'T00:00:00');

    for (let i = 1; i <= 4; i++) {

      const inicio = bimestreDates[`bimestre_${i}_inicio`];

      const fim = bimestreDates[`bimestre_${i}_fim`];

      if (inicio && fim) {

        const dInicio = new Date(inicio + 'T00:00:00');

        const dFim = new Date(fim + 'T23:59:59');

        if (data >= dInicio && data <= dFim) return i;

      }

    }

    return null;

  } catch (e) {

    return null;

  }

}

const OCC_COLOR_DOT = {

  'ATRASO': '⚪', 'OUTROS': '⚪',

  'ADVERTENCIA': '🔴', 'SUSPENSAO': '🔴',

  'OCORRENCIA LEVE': '🟡', 'OCORRENCIA MEDIA': '🟠', 'OCORRENCIA GRAVE': '🔴',

  'CELULAR': '🟡',

};

function occTypesForRole(role) {

  const gestor = ['ATRASO','OUTROS','ADVERTENCIA','SUSPENSAO','OCORRENCIA LEVE','OCORRENCIA MEDIA','OCORRENCIA GRAVE'];

  if (role === 'professor') return ['CELULAR','OCORRENCIA LEVE','OCORRENCIA MEDIA','OCORRENCIA GRAVE','OUTROS'];

  if (role === 'admin') return ['ATRASO','OUTROS','ADVERTENCIA','SUSPENSAO','OCORRENCIA LEVE','OCORRENCIA MEDIA','OCORRENCIA GRAVE','CELULAR'];

  return gestor;

}

async function loadPenalties(reload) {

  if (_penaltiesInitDone && !reload) return;

  try {

    const data = await API.get('/api/config');

    if (data && data.penalties) {

      OCC_PENALTY = data.penalties;

      _penaltiesInitDone = true;

    }

  } catch (e) { /* ignore */ }

}



function populateOccTypes() {

  const menu = document.getElementById('tipoDropdownMenu');

  const hidden = document.getElementById('tipoHidden');

  const label = document.getElementById('tipoDropdownLabel');

  if (!menu || !hidden || !label) return;

  const user = currentUser();

  const role = user ? user.cargo : '';

  const types = occTypesForRole(role).slice().sort((a, b) => {

    const pa = OCC_PENALTY[a] || 0;

    const pb = OCC_PENALTY[b] || 0;

    if (pa !== pb) return pa - pb;

    return a.localeCompare(b);

  });

  menu.innerHTML = types.map(t => {

    const p = OCC_PENALTY[t] || 0;

    const txt = p > 0 ? `${t} (-${p})` : `${t} (0)`;

    return `<div class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2" data-value="${t}">

      <span class="px-2 py-0.5 rounded-full text-xs font-medium ${tipoBadgeClass(t)}">${txt}</span>

    </div>`;

  }).join('');

  // attach click handlers

  menu.querySelectorAll('[data-value]').forEach(el => {

    el.addEventListener('click', () => {

      hidden.value = el.dataset.value;

      label.innerHTML = `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${tipoBadgeClass(el.dataset.value)}">${el.textContent.trim()}</span>`;

      menu.classList.add('hidden');

    });

  });

  // reset

  hidden.value = '';

  label.innerHTML = '<span class="text-muted">Selecione Tipo</span>';

}

function populateOccStudents(search) {

  const list = document.getElementById('occStudentList');

  const input = document.getElementById('occStudentInput');

  const hidden = document.getElementById('occStudentSelect');

  if (!list || !input || !hidden) return;

  const q = (search || '').toLowerCase().trim();

  list.innerHTML = '';

  // agrupa estudantes por turma

  const byTurma = {};

  (allStudents || []).forEach(s => {

    if (!byTurma[s.turma]) byTurma[s.turma] = [];

    byTurma[s.turma].push(s);

  });

  Object.keys(byTurma).sort().forEach(turma => {

    let alunos = byTurma[turma].sort((a,b) => a.nome.localeCompare(b.nome));

    if (q) {

      alunos = alunos.filter(s => s.nome.toLowerCase().includes(q) || turma.toLowerCase().includes(q));

    }

    if (alunos.length === 0) return;

    // grupo da turma

    const grp = document.createElement('div');

    grp.className = 'px-3 py-1.5 text-black text-sm font-bold uppercase tracking-wider';

    grp.textContent = turma;

    list.appendChild(grp);

    alunos.forEach(s => {

      const txt = `${s.nome} (${s.turma})`;

      const item = document.createElement('div');

      item.className = 'px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30';

      item.textContent = txt;

      item.onclick = () => {

        input.value = txt;

        hidden.value = s.id;

        document.getElementById('occStudentDropdown').classList.add('hidden');

      };

      list.appendChild(item);

    });

  });

  if (list.children.length === 0) {

    const empty = document.createElement('div');

    empty.className = 'px-3 py-2 text-sm text-muted italic';

    empty.textContent = 'Nenhum estudante encontrado';

    list.appendChild(empty);

  }

}

function prefillOccDateTime() {

  const now = new Date();

  const fmtDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

  const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);

  const dateInput = document.querySelector('#createOccForm input[name=data]');

  const timeInput = document.querySelector('#createOccForm input[name=hora]');

  if (dateInput) { dateInput.value = fmtDate; dateInput.max = fmtDate; }

  if (timeInput) timeInput.value = fmtTime;

}



async function loadOccurrences(reload) {

  occPage = 1;

  const tbody = document.getElementById('occTable');

  const occLoading = document.getElementById('occCardLoading');

  if (occLoading) occLoading.classList.remove('hidden');

  if (tbody) tbody.innerHTML = skeletonRow(7);

  try {

    await loadPenalties();

    // Só carrega alunos se ainda não temos em cache

    if (!allStudents || !allStudents.length) {

      await ensureStudents();

    }

    populateOccTypes();

    populateOccStudents('');

    prefillOccDateTime();

    if (!_occInitDone || reload) {

      const data = await API.get('/api/occurrences');

      allOccurrences = data;

      _occInitDone = true;

    }

    renderOccurrences();

  } catch (e) { toast(e.message, false); }

  finally {

    if (occLoading) occLoading.classList.add('hidden');

  }

}

function renderOccurrences(resetPage) {

  if (resetPage) occPage = 1;

  const by = document.getElementById('occFilterBy').value;

  const q = (document.getElementById('occSearch').value || '').toLowerCase().trim();

  let data = [...allOccurrences];

  const user = currentUser();

  if (by === 'mine') {

    data = data.filter(o => user && o.registered_by_user_id === user.id);

  }

  if (q) {

    if (by === 'turma') data = data.filter(o => String(o.student_turma || '').toLowerCase().includes(q));

    else if (by === 'nome') data = data.filter(o => String(o.student_nome || '').toLowerCase().includes(q));

  }

  const total = data.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (occPage > totalPages) occPage = totalPages;

  const start = (occPage - 1) * PAGE_SIZE;

  const pageData = data.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('occTable');

  const badgeClass = (tipo) => {

    if (tipo === 'OCORRENCIA LEVE' || tipo === 'CELULAR') return 'bg-yellow-100 text-yellow-700';

    if (tipo === 'OCORRENCIA MEDIA') return 'bg-orange-100 text-orange-700';

    if (tipo === 'OCORRENCIA GRAVE' || tipo === 'ADVERTENCIA' || tipo === 'SUSPENSAO') return 'bg-red-100 text-red-700';

    return 'bg-gray-200 text-gray-700';

  };

  const displayType = (tipo) => {

    const name = tipo.replace('OCORRENCIA ', '');

    const p = (OCC_PENALTY && OCC_PENALTY[tipo]) || 0;

    return p > 0 ? `${name} (-${p})` : `${name} (0)`;

  };

  tbody.innerHTML = pageData.map(o => `

    <tr class="border-t hover:bg-gray-100 dark:hover:bg-gray-700">

      <td class="p-2">${o.data_hora ? new Date(o.data_hora).toLocaleString('pt-BR') : ''}</td>

      <td class="p-2">${o.student_nome || o.student_id}</td>

      <td class="p-2"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass(o.tipo)}">${displayType(o.tipo)}</span></td>

      <td class="p-2">${o.nome_registrador} (${o.cargo_registrador})</td>

      <td class="p-2">${o.descricao}</td>

      <td class="p-2">

        ${canRemoveOccurrence(o) ? `<button onclick="removeOccurrence(${o.id})" title="Remover" class="text-red-600 hover:text-red-800">

          <i data-lucide="minus-circle" class="w-4 h-4"></i>

        </button>` : ''}

      </td>

    </tr>

  `).join('');

  if (window.lucide) lucide.createIcons();

  renderPagination('occPagination', occPage, totalPages, (p) => { occPage = p; renderOccurrences(false); });

}

document.getElementById('occFilterBy').addEventListener('change', () => renderOccurrences(true));

document.getElementById('occSearch').addEventListener('input', () => renderOccurrences(true));



document.getElementById('occStudentInput').addEventListener('click', () => {

  const d = document.getElementById('occStudentDropdown');

  d.classList.toggle('hidden');

  populateOccStudents('');

});

document.getElementById('occStudentInput').addEventListener('input', (e) => {

  const d = document.getElementById('occStudentDropdown');

  d.classList.remove('hidden');

  populateOccStudents(e.target.value);

});

document.getElementById('occStudentInput').addEventListener('keydown', (e) => {

  if (e.key === 'Escape') {

    document.getElementById('occStudentDropdown').classList.add('hidden');

  }

});

// fechar dropdown ao clicar fora

document.addEventListener('click', (e) => {

  const wrapper = document.getElementById('studentCustomSelect');

  if (!wrapper.contains(e.target)) {

    document.getElementById('occStudentDropdown').classList.add('hidden');

  }

});



document.getElementById('createOccForm').addEventListener('submit', async (e) => {

  e.preventDefault();

  const f = new FormData(e.target);

  const student_id = parseInt(f.get('student_id'));

  const tipo = f.get('tipo');

  const descricao = (f.get('descricao') || '').trim();

  const data = f.get('data');

  const hora = f.get('hora');

  if (!student_id || !tipo || !descricao || !data || !hora) { toast('Preencha todos os campos', false); return; }

  const data_hora = `${data}T${hora}:00`;

  const aluno = (allStudents || []).find(s => s.id === student_id);

  const nomeAluno = aluno ? aluno.nome : student_id;

  const btn = e.target.querySelector('button[type=submit]');

  confirmModal(`Confirmar registro de ocorrência "${tipo}" para ${nomeAluno}?`, async () => {

    setLoading(btn, true);

    try {

      await API.post('/api/occurrences', { student_id, tipo, descricao, data_hora });

      e.target.reset();

      prefillOccDateTime();

      populateOccTypes();

      populateOccStudents('');

      loadOccurrences(true);

      loadStudents(true);

      successModal('Ocorrência registrada com sucesso!');

    } catch (err) { toast(err.message, false); }

    finally { setLoading(btn, false); }

  });

});



window.removeOccurrence = (id) => {

  const btn = document.querySelector(`button[onclick="removeOccurrence(${id})"]`);

  confirmModal('Remover esta ocorrência?', async () => {

    setLoading(btn, true);

    try {

      await API.del(`/api/occurrences/${id}`);

      toast('Ocorrência removida');

      loadOccurrences(true);

      loadStudents(true);

    } catch (e) { toast(e.message, false); }

    finally { setLoading(btn, false); }

  });

};



// Classes

const _btnOccPdf = document.getElementById('loadClassOccPdf');

if (_btnOccPdf) _btnOccPdf.addEventListener('click', async () => {

  const turma = document.getElementById('className').value.trim();

  if (!turma) { toast('Informe a turma', false); return; }

  setLoading(_btnOccPdf, true);

  try {

    const res = await fetch(`/api/classes/${encodeURIComponent(turma)}/occurrences/pdf`, {

      headers: { 'Authorization': 'Bearer ' + API.token },

    });

    if (!res.ok) throw new Error('Erro ao gerar PDF');

    const blob = await res.blob();

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `ocorrencias_turma_${turma}.pdf`;

    a.click();

    URL.revokeObjectURL(url);

  } catch (err) { toast(err.message, false); }

  finally { setLoading(_btnOccPdf, false); }

});



const _btnPtsPdf = document.getElementById('loadClassPdf');

if (_btnPtsPdf) _btnPtsPdf.addEventListener('click', async () => {

  const turma = document.getElementById('className').value.trim();

  if (!turma) { toast('Informe a turma', false); return; }

  setLoading(_btnPtsPdf, true);

  try {

    const res = await fetch(`/api/classes/${encodeURIComponent(turma)}/points/pdf`, {

      headers: { 'Authorization': 'Bearer ' + API.token },

    });

    if (!res.ok) throw new Error('Erro ao gerar PDF');

    const blob = await res.blob();

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `pontos_${turma}.pdf`;

    a.click();

    URL.revokeObjectURL(url);

  } catch (err) { toast(err.message, false); }

  finally { setLoading(_btnPtsPdf, false); }

});



// Admin

async function loadRequests() {

  try {

    const data = await API.get(`/api/admin/registration-requests?status=pending`);

    const el = document.getElementById('reqList');

    if (!data.length) { el.innerHTML = '<p class="text-muted italic">Não há solicitações de cadastro</p>'; updateReqBadge(0); return; }

    el.innerHTML = data.map(r => `

      <div class="border rounded p-3 flex items-center justify-between">

        <div>

          <p class="font-medium">${r.nome_completo || r.username} <span class="text-muted text-xs">(cpf ${r.cpf || r.username})</span></p>

          <p class="text-xs text-muted flex items-center gap-2">${formatDateTime(r.created_at)} <span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(r.status)}">${statusLabel(r.status)}</span></p>

        </div>

        <div class="flex gap-2">

          <button onclick="approveReq(${r.id})" class="px-3 py-1 rounded bg-green-600 text-white text-xs">Aprovar</button>

          <button onclick="rejectReq(${r.id})" class="px-3 py-1 rounded bg-red-600 text-white text-xs">Rejeitar</button>

        </div>

      </div>

    `).join('');

    updateReqBadge(data.length);

  } catch (e) { toast(e.message, false); }

}



function updateReqBadge(count) {

  const badge = document.getElementById('reqBadge');

  if (!badge) return;

  if (count > 0) {

    badge.textContent = count;

    badge.classList.remove('hidden');

  } else {

    badge.classList.add('hidden');

  }

}



const adminBlockIds = { create: 'blkCreateAdmin', students: 'blkStudents', requests: 'blkRequests', config: 'blkConfig', bimestres: 'blkBimestres', users: 'blkUsers' };

const adminTitles = { create: 'Criar Admin', students: 'Estudantes', requests: 'Solicitações de Cadastro', config: 'Configuração de Pontos Formativos', bimestres: 'Configurar Bimestres', users: 'Usuários Cadastrados' };

let currentAdminBlock = null;

function openAdminModal(key) {

  const block = document.getElementById(adminBlockIds[key]);

  const body = document.getElementById('adminModalBody');

  if (currentAdminBlock && currentAdminBlock !== block) {

    document.getElementById('adminContentHolder').appendChild(currentAdminBlock);

  }

  currentAdminBlock = block;

  body.appendChild(block);

  document.getElementById('adminModalTitle').textContent = adminTitles[key];

  const modal = document.getElementById('adminModal');

  modal.classList.remove('hidden');

  modal.classList.add('flex');

  if (key === 'students') {

    const sel = document.querySelector('#blkStudents select[name=letra]');

    if (sel && sel.options.length <= 1) {

      for (let c = 65; c <= 90; c++) {

        const o = document.createElement('option');

        o.value = String.fromCharCode(c);

        o.textContent = String.fromCharCode(c);

        sel.appendChild(o);

      }

    }

  }

  if (key === 'requests') loadRequests();

  if (key === 'config') loadConfig();

  if (key === 'users') loadUsers();

  if (key === 'bimestres') loadBimestres();

  if (window.lucide) lucide.createIcons();

}

function closeAdminModal() {

  if (currentAdminBlock) {

    document.getElementById('adminContentHolder').appendChild(currentAdminBlock);

    currentAdminBlock = null;

  }

  const modal = document.getElementById('adminModal');

  modal.classList.add('hidden');

  modal.classList.remove('flex');

}



let allUsers = [];

async function loadUsers() {

  userPage = 1;

  try {

    const data = await API.get('/api/admin/users');

    allUsers = data;

    renderUsers();

  } catch (e) { toast(e.message, false); }

}

function renderUsers(resetPage) {

  if (resetPage) userPage = 1;

  const q = (document.getElementById('userSearch').value || '').toLowerCase().trim();

  let data = [...allUsers];

  if (q) data = data.filter(u => String(u.cpf || '').toLowerCase().includes(q) || String(u.nome_completo || '').toLowerCase().includes(q));

  const total = data.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (userPage > totalPages) userPage = totalPages;

  const start = (userPage - 1) * PAGE_SIZE;

  const pageData = data.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('usersTable');

  tbody.innerHTML = pageData.map(u => `

    <tr class="border-t hover:bg-gray-100 dark:hover:bg-gray-700">

      <td class="p-2">${u.cpf || u.username}</td>

      <td class="p-2">${u.nome_completo || u.username}</td>

      <td class="p-2">${u.cargo}</td>

      <td class="p-2">

        <div class="inline-flex items-center gap-2">

          <button onclick="resetPassword(${u.id})" title="Resetar senha" class="inline-flex items-center gap-1 px-2 py-1 rounded border surface text-xs text-blue-600 hover:text-blue-800">

            <i data-lucide="key-round" class="w-4 h-4"></i>

            Resetar senha

          </button>

          <div class="relative inline-block">

            <i data-lucide="user" class="w-3 h-3 absolute left-1.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none"></i>

            <select onchange="changeCargo(${u.id}, this.value)" title="Alterar cargo" class="border rounded pl-6 pr-2 py-1 surface text-xs text-blue-600 hover:text-blue-800">

              <option value="" disabled selected>Alterar perfil</option>

              ${['admin','soe','coordenador','supervisor','diretor','vicediretor','professor'].map(c => `<option value="${c}">${c}</option>`).join('')}

            </select>

          </div>

          <button onclick="removeUser(${u.id})" title="Remover" class="text-red-600 hover:text-red-800">

            <i data-lucide="minus-circle" class="w-4 h-4"></i>

          </button>

        </div>

      </td>

    </tr>

  `).join('');

  if (window.lucide) lucide.createIcons();

  renderPagination('usersPagination', userPage, totalPages, (p) => { userPage = p; renderUsers(false); });

}

document.getElementById('userSearch').addEventListener('input', () => renderUsers(true));



async function loadConfig() {

  try {

    const data = await API.get('/api/admin/config');

    document.getElementById('cfgInitial').value = data.initial_points;

    const container = document.getElementById('cfgPenalties');

    container.innerHTML = Object.keys(data.penalties).map(tipo => `

      <div class="flex items-center gap-2">

        <label class="text-sm flex-1">${tipo}</label>

        <input data-penalty="${tipo}" type="number" step="0.1" value="${data.penalties[tipo]}" class="border rounded px-2 py-1 surface w-24" />

      </div>

    `).join('');

  } catch (e) { toast(e.message, false); }

}



async function loadBimestres() {

  try {

    const data = await API.get('/api/admin/bimestres');

    if (data) {

      bimestreDates = data;

      for (let i = 1; i <= 4; i++) {

        document.getElementById(`bim${i}Inicio`).value = data[`bimestre_${i}_inicio`] || '';

        document.getElementById(`bim${i}Fim`).value = data[`bimestre_${i}_fim`] || '';

      }

    }

  } catch (e) { toast(e.message, false); }

}



document.getElementById('saveConfigBtn').addEventListener('click', async () => {

  const btn = document.getElementById('saveConfigBtn');

  setLoading(btn, true);

  const initial = parseFloat(document.getElementById('cfgInitial').value);

  const penalties = {};

  document.querySelectorAll('#cfgPenalties input[data-penalty]').forEach(inp => {

    penalties[inp.dataset.penalty] = parseFloat(inp.value);

  });

  try {

    await API.put('/api/admin/config', { initial_points: initial, penalties });

    toast('Configuração salva e pontos recalculados');

    await loadPenalties(true);

    loadConfig();

    loadStudents(true);

    loadOccurrences(true);

  } catch (err) { toast(err.message, false); }

  finally { setLoading(btn, false); }

});



document.getElementById('saveBimestresBtn').addEventListener('click', async () => {

  const btn = document.getElementById('saveBimestresBtn');

  setLoading(btn, true);

  const data = {};

  for (let i = 1; i <= 4; i++) {

    data[`bimestre_${i}_inicio`] = document.getElementById(`bim${i}Inicio`).value;

    data[`bimestre_${i}_fim`] = document.getElementById(`bim${i}Fim`).value;

  }

  try {

    await API.put('/api/admin/bimestres', data);

    toast('Datas dos bimestres salvas');

  } catch (err) { toast(err.message, false); }

  finally { setLoading(btn, false); }

});



window.changeCargo = async (id, cargo) => {

  const sel = document.querySelector(`select[onchange="changeCargo(${id}, this.value)"]`);

  setLoading(sel, true);

  try {

    await API.patch(`/api/admin/users/${id}/cargo`, { cargo });

    toast('Cargo atualizado');

    loadUsers();

  } catch (e) { toast(e.message, false); }

  finally { setLoading(sel, false); }

};



window.removeUser = (id) => {

  const btn = document.querySelector(`button[onclick="removeUser(${id})"]`);

  confirmModal('Remover este usuário?', async () => {

    setLoading(btn, true);

    try {

      await API.del(`/api/admin/users/${id}`);

      toast('Usuário removido');

      loadUsers();

    } catch (e) { toast(e.message, false); }

    finally { setLoading(btn, false); }

  });

};



window.resetPassword = (id) => {

  const btn = document.querySelector(`button[onclick="resetPassword(${id})"]`);

  confirmModal('Resetar a senha deste usuário para o CPF?', async () => {

    setLoading(btn, true);

    try {

      await API.post(`/api/admin/users/${id}/reset-password`);

      toast('Senha resetada');

    } catch (e) { toast(e.message, false); }

    finally { setLoading(btn, false); }

  });

};



window.approveReq = (id) => {

  const cargos = ['soe','coordenador','supervisor','diretor','vicediretor','professor'].sort();

  const opts = cargos.map(c => `<option value="${c}" ${c === 'professor' ? 'selected' : ''}>${c}</option>`).join('');

  openModal(`

    <p class="mb-3 font-medium">Selecionar cargo para o usuário</p>

    <select id="approveCargo" class="w-full border rounded px-3 py-2 surface mb-4">${opts}</select>

    <div class="flex gap-2 justify-center">

      <button id="modalCancel" class="px-4 py-2 rounded border surface">Cancelar</button>

      <button id="modalConfirm" class="btn-primary px-4 py-2 rounded">Aprovar</button>

    </div>

  `);

  document.getElementById('modalCancel').onclick = closeModal;

  document.getElementById('modalConfirm').onclick = async () => {

    const btn = document.getElementById('modalConfirm');

    const cargo = document.getElementById('approveCargo').value;

    closeModal();

    setLoading(btn, true);

    try {

      await API.post(`/api/admin/registration-requests/${id}/approve`, { cargo });

      toast('Aprovado');

      loadRequests();

      loadUsers();

    } catch (e) { toast(e.message, false); }

    finally { setLoading(btn, false); }

  };

};

window.rejectReq = async (id) => {

  const btn = document.querySelector(`button[onclick="rejectReq(${id})"]`);

  setLoading(btn, true);

  try { await API.post(`/api/admin/registration-requests/${id}/reject`); toast('Rejeitado'); loadRequests(); } catch (e) { toast(e.message, false); }

  finally { setLoading(btn, false); }

};



document.getElementById('createAdminForm').addEventListener('submit', async (e) => {

  e.preventDefault();

  const f = new FormData(e.target);

  const username = f.get('username');

  const password = f.get('password');

  openModal(`

    <p class="mb-3 font-medium">Confirme sua senha de admin</p>

    <input id="adminPwdConfirm" type="password" placeholder="Senha do admin logado" class="w-full border rounded px-3 py-2 surface mb-4" />

    <div class="flex gap-2 justify-center">

      <button id="modalCancel" class="px-4 py-2 rounded border surface">Cancelar</button>

      <button id="modalConfirm" class="btn-primary px-4 py-2 rounded">Confirmar</button>

    </div>

  `);

  document.getElementById('modalCancel').onclick = closeModal;

  document.getElementById('modalConfirm').onclick = async () => {

    const btn = document.getElementById('modalConfirm');

    const admin_password = document.getElementById('adminPwdConfirm').value;

    closeModal();

    setLoading(btn, true);

    try {

      await API.post('/api/admin/users', { username, password, cargo: 'admin', admin_password });

      e.target.reset();

      loadUsers();

      successModal('Usuário criado com sucesso!');

    } catch (err) { toast(err.message, false); }

    finally { setLoading(btn, false); }

  };

});



// PDF download with auth via fetch (override downloadStudentPdf)

// Variável para armazenar o bimestre selecionado no PDF
let pdfBimestreSelected = '';

function openPdfBimestreModal(id) {
  const btn = document.querySelector(`button[onclick="downloadStudentPdf(${id})"]`);
  setLoading(btn, false);
  const modal = document.getElementById('pdfBimestreModal');
  const select = document.getElementById('pdfBimestreSelect');
  select.value = '';
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('pdfBimestreOk').onclick = () => {
    const val = select.value;
    if (!val) {
      toast('Selecione um bimestre.', false);
      return;
    }
    pdfBimestreSelected = val;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    generateStudentPdf(id, pdfBimestreSelected);
  };
  document.getElementById('pdfBimestreCancel').onclick = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    setLoading(btn, false);
  };
}

async function generateStudentPdf(id, bimestre) {
  const btn = document.querySelector(`button[onclick="downloadStudentPdf(${id})"]`);
  setLoading(btn, true);
  try {
    const url = bimestre && bimestre !== 'all'
      ? `/api/students/${id}/occurrences/pdf?bimestre=${bimestre}&token=${API.token}`
      : `/api/students/${id}/occurrences/pdf?token=${API.token}`;
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + API.token },
    });
    if (!res.ok) throw new Error('Erro ao gerar PDF');
    const blob = await res.blob();
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `ocorrencias_${id}.pdf`;
    a.click();
    URL.revokeObjectURL(urlObj);
  } catch (err) {
    toast(err.message, false);
  } finally {
    setLoading(btn, false);
  }
}

window.downloadStudentPdf = async (id) => {
  openPdfBimestreModal(id);
};



// Populate turma letters

(function populateLetras() {

  const sel = document.querySelector('select[name=letra]');

  if (!sel) return;

  for (let c = 65; c <= 90; c++) {

    const o = document.createElement('option');

    o.value = String.fromCharCode(c);

    o.textContent = String.fromCharCode(c);

    sel.appendChild(o);

  }

})();



// Hash routing guard

window.addEventListener('hashchange', () => {

  if (window._settingHash) { window._settingHash = false; return; }

  const user = currentUser();

  const name = (location.hash || '').replace('#', '');

  if (!user || !API.token) {

    if (name) location.hash = '';

    showView('auth', false);

    return;

  }

  const allowed = {

    admin: ['dashboard','students','occurrences','classes','admin'],

    professor: ['occurrences'],

    soe: ['occurrences'],

    coordenador: ['dashboard','students','occurrences','classes'],

    supervisor: ['dashboard','students','occurrences','classes'],

    vicediretor: ['dashboard','students','occurrences','classes'],

    diretor: ['dashboard','students','occurrences','classes'],

  }[user.cargo] || ['occurrences'];

  if (allowed.includes(name)) {

    showView(name, false);

  } else {

    location.hash = allowed[0];

    showView(allowed[0], false);

  }

});



// Tipo dropdown toggle

document.addEventListener('click', (e) => {

  const btn = document.getElementById('tipoDropdownBtn');

  const menu = document.getElementById('tipoDropdownMenu');

  if (!btn || !menu) return;

  if (btn.contains(e.target)) {

    menu.classList.toggle('hidden');

  } else if (!menu.contains(e.target)) {

    menu.classList.add('hidden');

  }

});



// Init

updateAuthUI();



// Calcular bimestre dinamicamente quando a data muda

document.getElementById('occDataInput')?.addEventListener('change', (e) => {

  const dataStr = e.target.value;

  if (!dataStr) return;

  const horaInput = document.querySelector('#createOccForm input[name=hora]');

  const hora = horaInput ? horaInput.value : '00:00';

  const dataHoraStr = `${dataStr}T${hora}:00`;

  const bimestre = calcularBimestreFrontend(dataHoraStr);

  const display = document.getElementById('occBimestreDisplay');

  if (display) {

    display.value = bimestre ? `B${bimestre}` : 'Não definido';

    display.className = 'border rounded px-3 py-2 surface w-full ' + (bimestre ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700');

  }

});

