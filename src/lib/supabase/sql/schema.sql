-- ==========================================
-- TABLA CLIENTES
-- ==========================================
CREATE TABLE clientes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- TABLA PRODUCTOS
-- ==========================================
CREATE TABLE productos (
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
CREATE TABLE fiados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    monto_total NUMERIC(10,2) NOT NULL CHECK (monto_total > 0),
    saldo_pendiente NUMERIC(10,2) NOT NULL,
    fecha TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'parcial', 'pagado')),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_fiado_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE
);

-- ==========================================
-- TABLA PAGOS
-- ==========================================
CREATE TABLE pagos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fiado_id BIGINT NOT NULL,
    monto_pagado NUMERIC(10,2) NOT NULL CHECK (monto_pagado > 0),
    fecha_pago TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_pago_fiado
        FOREIGN KEY (fiado_id)
        REFERENCES fiados(id)
        ON DELETE CASCADE
);

-- ==========================================
-- TABLA VENTAS
-- ==========================================
CREATE TABLE ventas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    fecha TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- DETALLE DE VENTAS
-- ==========================================
CREATE TABLE detalle_venta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    venta_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_detalle_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON DELETE RESTRICT
);
