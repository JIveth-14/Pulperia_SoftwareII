import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as pg from 'pg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

interface Column {
  nombre: string;
  tipo: string;
  pk: boolean;
  nulo: boolean;
  default: string | null;
  unique?: boolean;
  fk?: string;
}

interface Table {
  nombre: string;
  filas: number;
  descripcion: string;
  columnas: Column[];
}

interface Relation {
  nombre: string;
  tabla_origen: string;
  columna_origen: string;
  tabla_destino: string;
  columna_destino: string;
  tipo: string;
}

interface Index {
  nombre: string;
  tabla: string;
  columnas: string[];
  unico?: boolean;
}

interface DBExport {
  generado_at: string;
  motor: string;
  base_datos: string;
  descripcion: string;
  tablas: Table[];
  relaciones: Relation[];
  indices: Index[];
}

async function exportDBModel(): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const tables: Table[] = [];
  const relations: Relation[] = [];
  const indices: Index[] = [];

  try {
    console.log('🔄 Extrayendo modelo de datos...');

    // Tablas conocidas en el proyecto
    const tableNames = [
      'clientes',
      'productos',
      'ventas',
      'detalle_venta',
      'fiados',
      'pagos',
    ];

    for (const tableName of tableNames) {
      // Contar filas
      const { count: rowCount, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      const rows = !countError && rowCount !== null ? rowCount : 0;

      // Obtener una fila para analizar estructura
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleError && sampleError.code !== 'PGRST116') {
        console.warn(`⚠️  Tabla ${tableName} no accesible`);
        continue;
      }

      // Definir columnas por tabla (metadata predefinida)
      const tableColumns = getTableColumns(tableName);
      const description = getTableDescription(tableName);

      tables.push({
        nombre: tableName,
        filas: rows,
        descripcion: description,
        columnas: tableColumns,
      });
    }

    // Construir relaciones
    const relationsList = getRelations(tables);
    relations.push(...relationsList);

    // Construir índices
    for (const table of tables) {
      // Índice primary key
      indices.push({
        nombre: `pk_${table.nombre}`,
        tabla: table.nombre,
        columnas: ['id'],
        unico: true,
      });

      // Índices en FKs
      for (const col of table.columnas) {
        if (
          col.nombre.endsWith('_id') &&
          col.nombre !== 'id' &&
          col.tipo === 'BIGINT'
        ) {
          indices.push({
            nombre: `idx_${table.nombre}_${col.nombre}`,
            tabla: table.nombre,
            columnas: [col.nombre],
          });
        }
      }

      // Índices en columnas únicas
      for (const col of table.columnas) {
        if (
          col.unique &&
          (col.nombre === 'telefono' || col.nombre === 'email')
        ) {
          indices.push({
            nombre: `idx_${table.nombre}_${col.nombre}`,
            tabla: table.nombre,
            columnas: [col.nombre],
            unico: true,
          });
        }
      }

      // Índice en created_at
      if (table.columnas.some((c) => c.nombre === 'created_at')) {
        indices.push({
          nombre: `idx_${table.nombre}_created_at`,
          tabla: table.nombre,
          columnas: ['created_at'],
        });
      }
    }

    // Eliminar índices duplicados
    const uniqueIndices = Array.from(
      new Map(indices.map((i) => [i.nombre, i])).values()
    );

    const dbExport: DBExport = {
      generado_at: new Date().toISOString(),
      motor: 'PostgreSQL',
      base_datos: 'Pulpería (Supabase)',
      descripcion:
        'Base de datos para gestión de pulpería: clientes, productos, ventas, fiados y pagos',
      tablas: tables,
      relaciones: relations,
      indices: uniqueIndices,
    };

    // Asegurar que docs/ existe
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Escribir archivo JSON
    const outputPath = path.join(docsDir, 'db-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(dbExport, null, 2), 'utf-8');

    console.log(`✅ Modelo de datos exportado a: ${outputPath}`);
    console.log(`📊 Estadísticas:`);
    console.log(`   - Tablas: ${tables.length}`);
    console.log(
      `   - Columnas: ${tables.reduce((sum, t) => sum + t.columnas.length, 0)}`
    );
    console.log(`   - Relaciones: ${relations.length}`);
    console.log(`   - Índices: ${uniqueIndices.length}`);
    console.log(
      `   - Total filas: ${tables.reduce((sum, t) => sum + t.filas, 0)}`
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function getTableColumns(tableName: string): Column[] {
  const columns: { [key: string]: Column[] } = {
    clientes: [
      { nombre: 'id', tipo: 'BIGINT', pk: true, nulo: false, default: null },
      {
        nombre: 'nombre',
        tipo: 'VARCHAR(255)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'telefono',
        tipo: 'VARCHAR(20)',
        pk: false,
        nulo: false,
        default: null,
        unique: true,
      },
      {
        nombre: 'direccion',
        tipo: 'TEXT',
        pk: false,
        nulo: true,
        default: null,
      },
      {
        nombre: 'created_at',
        tipo: 'TIMESTAMP',
        pk: false,
        nulo: false,
        default: 'NOW()',
      },
    ],
    productos: [
      { nombre: 'id', tipo: 'BIGINT', pk: true, nulo: false, default: null },
      {
        nombre: 'nombre',
        tipo: 'VARCHAR(255)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'precio',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'stock',
        tipo: 'INT',
        pk: false,
        nulo: false,
        default: '0',
      },
      {
        nombre: 'stock_minimo',
        tipo: 'INT',
        pk: false,
        nulo: false,
        default: '5',
      },
      {
        nombre: 'created_at',
        tipo: 'TIMESTAMP',
        pk: false,
        nulo: false,
        default: 'NOW()',
      },
    ],
    ventas: [
      { nombre: 'id', tipo: 'BIGINT', pk: true, nulo: false, default: null },
      {
        nombre: 'total',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'fecha',
        tipo: 'DATE',
        pk: false,
        nulo: false,
        default: 'TODAY()',
      },
      {
        nombre: 'created_at',
        tipo: 'TIMESTAMP',
        pk: false,
        nulo: false,
        default: 'NOW()',
      },
    ],
    detalle_venta: [
      { nombre: 'id', tipo: 'BIGINT', pk: true, nulo: false, default: null },
      {
        nombre: 'venta_id',
        tipo: 'BIGINT',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'producto_id',
        tipo: 'BIGINT',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'cantidad',
        tipo: 'INT',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'precio_unitario',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'subtotal',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
    ],
    fiados: [
      { nombre: 'id', tipo: 'BIGINT', pk: true, nulo: false, default: null },
      {
        nombre: 'cliente_id',
        tipo: 'BIGINT',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'monto_total',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'saldo_pendiente',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'estado',
        tipo: 'VARCHAR(20)',
        pk: false,
        nulo: false,
        default: "'pendiente'",
      },
      {
        nombre: 'fecha',
        tipo: 'DATE',
        pk: false,
        nulo: false,
        default: 'TODAY()',
      },
      {
        nombre: 'created_at',
        tipo: 'TIMESTAMP',
        pk: false,
        nulo: false,
        default: 'NOW()',
      },
    ],
    pagos: [
      { nombre: 'id', tipo: 'BIGINT', pk: true, nulo: false, default: null },
      {
        nombre: 'fiado_id',
        tipo: 'BIGINT',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'monto_pagado',
        tipo: 'DECIMAL(10,2)',
        pk: false,
        nulo: false,
        default: null,
      },
      {
        nombre: 'fecha_pago',
        tipo: 'DATE',
        pk: false,
        nulo: false,
        default: 'TODAY()',
      },
      {
        nombre: 'created_at',
        tipo: 'TIMESTAMP',
        pk: false,
        nulo: false,
        default: 'NOW()',
      },
    ],
  };

  return columns[tableName] || [];
}

function getTableDescription(tableName: string): string {
  const descriptions: { [key: string]: string } = {
    clientes:
      'Registro de clientes de la pulpería con información de contacto',
    productos:
      'Inventario de productos con precios y niveles de stock',
    ventas: 'Cabecera de transacciones de venta',
    detalle_venta:
      'Líneas individuales de productos en cada venta con cantidad y precio',
    fiados: 'Registro de deudas (fiados) de clientes con saldo pendiente',
    pagos: 'Registro de pagos parciales o totales de fiados',
  };

  return descriptions[tableName] || `Tabla ${tableName}`;
}

function getRelations(tables: Table[]): Relation[] {
  const relations: Relation[] = [];

  // FK: fiados.cliente_id -> clientes.id
  relations.push({
    nombre: 'fk_fiados_cliente_id',
    tabla_origen: 'fiados',
    columna_origen: 'cliente_id',
    tabla_destino: 'clientes',
    columna_destino: 'id',
    tipo: 'MANY_TO_ONE',
  });

  relations.push({
    nombre: 'fk_clientes_fiados',
    tabla_origen: 'clientes',
    columna_origen: 'id',
    tabla_destino: 'fiados',
    columna_destino: 'cliente_id',
    tipo: 'ONE_TO_MANY',
  });

  // FK: pagos.fiado_id -> fiados.id
  relations.push({
    nombre: 'fk_pagos_fiado_id',
    tabla_origen: 'pagos',
    columna_origen: 'fiado_id',
    tabla_destino: 'fiados',
    columna_destino: 'id',
    tipo: 'MANY_TO_ONE',
  });

  relations.push({
    nombre: 'fk_fiados_pagos',
    tabla_origen: 'fiados',
    columna_origen: 'id',
    tabla_destino: 'pagos',
    columna_destino: 'fiado_id',
    tipo: 'ONE_TO_MANY',
  });

  // FK: detalle_venta.venta_id -> ventas.id
  relations.push({
    nombre: 'fk_detalle_venta_venta_id',
    tabla_origen: 'detalle_venta',
    columna_origen: 'venta_id',
    tabla_destino: 'ventas',
    columna_destino: 'id',
    tipo: 'MANY_TO_ONE',
  });

  relations.push({
    nombre: 'fk_ventas_detalle_venta',
    tabla_origen: 'ventas',
    columna_origen: 'id',
    tabla_destino: 'detalle_venta',
    columna_destino: 'venta_id',
    tipo: 'ONE_TO_MANY',
  });

  // FK: detalle_venta.producto_id -> productos.id
  relations.push({
    nombre: 'fk_detalle_venta_producto_id',
    tabla_origen: 'detalle_venta',
    columna_origen: 'producto_id',
    tabla_destino: 'productos',
    columna_destino: 'id',
    tipo: 'MANY_TO_ONE',
  });

  relations.push({
    nombre: 'fk_productos_detalle_venta',
    tabla_origen: 'productos',
    columna_origen: 'id',
    tabla_destino: 'detalle_venta',
    columna_destino: 'producto_id',
    tipo: 'ONE_TO_MANY',
  });

  return relations;
}

exportDBModel();
