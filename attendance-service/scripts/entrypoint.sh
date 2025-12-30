#!/bin/sh
npx prisma migrate deploy --skip-generate
exec node dist/main.js
