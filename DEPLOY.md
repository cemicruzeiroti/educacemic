# Deploy em produção — PythonAnywhere + Supabase (Postgres)

Arquitetura: **frontend + backend Flask no PythonAnywhere**, **banco Postgres no Supabase**.
O Flask serve o frontend em `/` e a API em `/api/*` (mesmo origin), então o front-end
já chama as rotas normalmente, sem CORS.

## 1. Criar o banco no Supabase (gratuito)
1. Acesse https://supabase.com → "New project".
2. Escolha nome, senha do banco e região (ex.: South America).
3. Após criar, vá em **Project Settings → Database → Connection string → URI**.
4. Copie a URI (formato `postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres`).
5. (Opcional) Em "Database" → "Tables" você verá as tabelas após o primeiro boot.

## 2. Subir o app no PythonAnywhere
1. Crie conta em https://www.pythonanywhere.com (plano gratuito).
2. Faça upload/clone do projeto para `/home/<user>/educa-cemi`.
3. Painel "Web" → "Add a new web app" → Manual configuration → Python 3.12.
4. "Code" → WSGI file → aponte para `/home/<user>/educa-cemi/wsgi.py`.
5. Crie o virtualenv e instale:
   ```
   mkvirtualenv educa --python=python3.12
   pip install -r /home/<user>/educa-cemi/requirements.txt
   ```
6. Em "Web" → "Environment variables", adicione:
   - `DATABASE_URL` = a URI do Supabase (copiada no passo 1.4)
   - `SECRET_KEY` = uma string longa e aleatória
   - `JWT_SECRET_KEY` = outra string longa e aleatória
7. Clique "Reload". Acesse `https://<user>.pythonanywhere.com`.

O `wsgi.py` cria as tabelas e o admin padrão (`admin`/`admin`) no primeiro boot.
**Troque a senha do admin logo após o primeiro login.**

## Variáveis de ambiente
- `DATABASE_URL` — Postgres (Supabase) em produção; se omitida, usa SQLite local.
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `PYTHON_VERSION` = `3.12.3` (no Render, força Python 3.12, compatível com psycopg2)

## Deploy no Render (Opção A — recomendada)

1. Suba o projeto para um repositório GitHub.
2. Em https://render.com → "New" → "Web Service" → conecte o repo.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn wsgi:app`
   - **Instance Type:** Free.
3. Em "Environment", adicione:
   - `DATABASE_URL` = URI do Supabase
   - `SECRET_KEY` = string longa
   - `JWT_SECRET_KEY` = string longa
   - `PYTHON_VERSION` = `3.12.3`
4. Deploy. O `wsgi.py` cria as tabelas e o admin padrão no primeiro boot.

> O plano free do Render "dorme" após 15 min de inatividade (~30-60s para acordar).

## Observação importante sobre a senha do Supabase
Se a senha do banco contiver caracteres especiais (`@`, `#`, `:`, `/`, etc.), ela deve estar
**URL-encoded** na `DATABASE_URL`. Exemplo: senha `a@b` → `a%40b`.

O projeto tenta corrigir automaticamente, mas se o erro persistir, verifique a URI copiada.

## Como o front-end chama as rotas
O frontend é servido pelo próprio Flask (mesmo origin), então as chamadas são relativas:
```
POST /api/auth/login
GET  /api/students
...
```
Não é necessário configurar CORS nem URL base. O `api.js` usa `base = ''` (same origin).