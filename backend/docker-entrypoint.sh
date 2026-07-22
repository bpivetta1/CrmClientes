#!/bin/sh
set -e

echo "==> Running database migrations"
# run twice: some migrations depend on ordering the CLI resolves on a second pass.
# non-fatal so an already-migrated DB doesn't block startup (matches official installer).
npx sequelize db:migrate || true
npx sequelize db:migrate || true

echo "==> Running database seeds"
npx sequelize db:seed:all || true

echo "==> Starting backend"
exec node dist/server.js
