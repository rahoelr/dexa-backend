#!/bin/sh
npx prisma db push --skip-generate
npx prisma db seed
exec node dist/main.js
