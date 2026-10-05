# Database tests

Scenario tests for SQL functions, run against a throwaway local Postgres (no Supabase CLI needed).

```sh
initdb -D /tmp/pgtest -U postgres && pg_ctl -D /tmp/pgtest -o "-p 54329 -k /tmp" -l /tmp/pgtest.log start
createdb -h /tmp -p 54329 -U postgres kj
# Minimal stand-ins for Supabase's roles and auth schema
psql -h /tmp -p 54329 -U postgres -d kj -c "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS \$\$ SELECT nullif(current_setting('request.jwt.sub', true), '')::uuid \$\$;"
for f in supabase/migrations/*.sql; do psql -h /tmp -p 54329 -U postgres -d kj -q -v ON_ERROR_STOP=1 -f "$f"; done
for f in supabase/tests/*.test.sql; do psql -h /tmp -p 54329 -U postgres -d kj -v ON_ERROR_STOP=1 -f "$f"; done
```

Each test file runs in a transaction and rolls back, so it can be re-run.
