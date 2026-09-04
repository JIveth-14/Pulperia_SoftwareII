-- Migration: Enable Required PostgreSQL Extensions
-- This migration enables PostgreSQL extensions needed by the application.
-- Idempotent: YES (CREATE EXTENSION IF NOT EXISTS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
