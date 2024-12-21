#!/bin/bash
#set -eux

npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
