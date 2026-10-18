-- Scripts de inicializacao do PostgreSQL compartilhado pelo legado.
-- Executado uma unica vez, na criacao do volume (via
-- /docker-entrypoint-initdb.d da imagem oficial do postgres).

-- Banco do servico `auth` (separado do brain: ambos tem tabela `users` com
-- colunas diferentes; no mesmo banco o GORM funde as duas e o /register quebra).
SELECT 'CREATE DATABASE auth_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db')\gexec

-- Usuario do servico `auth`.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'auth_user') THEN
    CREATE USER auth_user WITH PASSWORD 'auth_password';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE auth_db TO auth_user;

-- Banco do servico `watcher` (a imagem oficial so cria o banco de POSTGRES_DB).
SELECT 'CREATE DATABASE watcher_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'watcher_db')\gexec

-- Usuario do servico `watcher` (padrao do codigo arthemis-watcher).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'watcher_user') THEN
    CREATE USER watcher_user WITH PASSWORD 'watcher_password';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE watcher_db TO watcher_user;
GRANT ALL PRIVILEGES ON DATABASE app_db TO watcher_user;

-- Permissao de escrita no schema public dos bancos (Postgres 15+ removeu o
-- CREATE do PUBLIC por padrao; sem isso o AutoMigrate do GORM falha com
-- "permission denied for schema public").
\c auth_db
GRANT ALL ON SCHEMA public TO auth_user;
ALTER DEFAULT PRIVILEGES FOR ROLE auth_user IN SCHEMA public GRANT ALL ON TABLES TO auth_user;

\c watcher_db
GRANT ALL ON SCHEMA public TO watcher_user;
ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA public GRANT ALL ON TABLES TO watcher_user;

\c app_db
GRANT ALL ON SCHEMA public TO watcher_user;
GRANT ALL ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA public GRANT ALL ON TABLES TO app_user;
