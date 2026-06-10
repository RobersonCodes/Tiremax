-- TireMax ERP — SQL Reference Script
-- Run via: npm run db:migrate (preferred)
-- Or execute manually in MySQL

CREATE DATABASE IF NOT EXISTS tiremax_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tiremax_erp;

-- This is generated automatically by Prisma when you run:
-- npx prisma migrate dev --name init
-- The actual migration files will be in backend/prisma/migrations/

-- To run manually after installing dependencies:
-- cd backend
-- npx prisma migrate dev
-- node prisma/seed.js
