-- Migration: Create Core Tables
-- This migration creates all core tables for the pulpería application.
-- Idempotent: YES (CREATE TABLE IF NOT EXISTS)

-- ==========================================
-- TABLA CLIENTES
-- ==========================================
CREATE TABLE IF NOT EXISTS clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABLA PRODUCTOS
-- ==========================================
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABLA FIADOS
-- ==========================================
CREATE TABLE IF NOT EXISTS fiados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    monto_total NUMERIC(10,2) NOT NULL CHECK (monto_total > 0),
    saldo_pendiente NUMERIC(10,2) NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'pagado')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABLA PAGOS
-- ==========================================
CREATE TABLE IF NOT EXISTS pagos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fiado_id BIGINT NOT NULL,
    monto_pagado NUMERIC(10,2) NOT NULL CHECK (monto_pagado > 0),
    fecha_pago TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABLA VENTAS
-- This table has been updated to include cliente_id and tipo_pago from the start.
-- ==========================================
CREATE TABLE IF NOT EXISTS ventas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT,
    tipo_pago TEXT NOT NULL DEFAULT 'contado' CHECK (tipo_pago IN ('contado', 'fiado')),
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    fecha TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABLA DETALLE_VENTA
-- ==========================================
CREATE TABLE IF NOT EXISTS detalle_venta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    venta_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);
