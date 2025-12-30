#!/bin/sh
npx prisma generate
node dist/src/main.js
