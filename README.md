# Educa CEMI - API de Registro de Ocorrencias

Backend em Flask para sistema educacional de registro de ocorrencias de alunos.

## Estrutura

```
app/
  __init__.py
  config.py
  models/
  routes/
  services/
  utils/
run.py
requirements.txt
```

## Instalacao

```bash
python -m pip install -r requirements.txt
```

## Execucao

```bash
python run.py
```

O servidor sobe em http://127.0.0.1:5000. Na primeira execucao e criado o admin padrao:
- usuario: `admin`
- senha: `admin`

Banco SQLite: `educa_cemi.db` (criado automaticamente).

## Autenticacao

Todas as rotas (exceto login, registro publico e root) exigem header:

```
Authorization: Bearer <access_token>
```

## Endpoints principais

- `POST /api/auth/login` - login (username, password)
- `POST /api/auth/register` - cadastro publico (pendente de aprovacao)
- `GET /api/admin/registration-requests` - listar solicitacoes (admin)
- `POST /api/admin/registration-requests/<id>/approve` - aprovar
- `POST /api/admin/registration-requests/<id>/reject` - rejeitar
- `POST /api/admin/users` - criar admin (admin)
- `POST /api/students` - cadastrar aluno (admin/coordenador/supervisor/diretor/vicediretor)
- `POST /api/students/bulk` - importar CSV (campo file)
- `PATCH /api/students/<id>` - atualizar aluno/pontos
- `POST /api/occurrences` - registrar ocorrencia
- `GET /api/occurrences` - listar (filtros: student_id, turma)
- `GET /api/students/<id>/occurrences/pdf` - PDF de ocorrencias do aluno
- `GET /api/classes/<turma>/occurrences` - ocorrencias da turma
- `GET /api/classes/<turma>/points/pdf` - PDF de pontos formativos da turma

## CSV de importacao

Colunas aceitas: `nome,turma` (ou `name,class`).

## Configuracao

Pontos iniciais e descontos por tipo em `app/config.py`:
- INITIAL_FORMATIVE_POINTS = 1.0
- OCCURRENCE_PENALTIES = {grave:0.5, media:0.3, leve:0.1}

Grupos de cargos ajustaveis na mesma config.