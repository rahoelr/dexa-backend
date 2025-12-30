#!/bin/sh
npx prisma db push --skip-generate
exec node dist/main.js
