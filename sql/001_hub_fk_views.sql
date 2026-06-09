-- ================================================================
-- POS DL v1 — Hub de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- ================================================================
--
-- NOMENCLATURA:
--   almacenes  → Catálogo de bodegas (nombre, sucursal, empresa)
--   almacen    → Inventario/stock (cantidad de productos por bodega)
--
-- INSTRUCCIONES:
--   1. Ejecutar PASO 1 primero para ver huérfanos sin borrar nada
--   2. Revisar resultados
--   3. Ejecutar PASO 2 para limpiar y agregar FK + vistas + índices
-- ================================================================


-- ── PASO 1: VER HUÉRFANOS (solo lectura) ─────────────────────────

/*
SELECT 'almacenes' AS tabla, id, id_empresa AS id_ref FROM almacenes
  WHERE id_empresa NOT IN (SELECT id FROM empresa)
UNION ALL
SELECT 'almacen (stock)', id, id_almacen FROM almacen
  WHERE id_almacen NOT IN (SELECT id FROM almacenes)
UNION ALL
SELECT 'almacen (stock)', id, id_producto FROM almacen
  WHERE id_producto NOT IN (SELECT id FROM productos)
UNION ALL
SELECT 'kardex', id, id_empresa FROM kardex
  WHERE id_empresa NOT IN (SELECT id FROM empresa)
UNION ALL
SELECT 'kardex', id, id_almacen FROM kardex
  WHERE id_almacen NOT IN (SELECT id FROM almacenes)
UNION ALL
SELECT 'productos', id, id_empresa FROM productos
  WHERE id_empresa NOT IN (SELECT id FROM empresa)
UNION ALL
SELECT 'usuarios', id, id_empresa FROM usuarios
  WHERE id_empresa NOT IN (SELECT id FROM empresa)
UNION ALL
SELECT 'ventas', id, id_empresa FROM ventas
  WHERE id_empresa NOT IN (SELECT id FROM empresa)
UNION ALL
SELECT 'detalle_ventas', id, id_venta FROM detalle_ventas
  WHERE id_venta NOT IN (SELECT id FROM ventas)
UNION ALL
SELECT 'sesiones_caja', id, id_almacen FROM sesiones_caja
  WHERE id_almacen NOT IN (SELECT id FROM almacenes);
*/


-- ── PASO 2: LIMPIAR HUÉRFANOS ─────────────────────────────────────

-- Orden: hijos primero, luego padres
DELETE FROM detalle_ventas WHERE id_venta    NOT IN (SELECT id FROM ventas);
DELETE FROM sesiones_caja  WHERE id_almacen  NOT IN (SELECT id FROM almacenes);
DELETE FROM kardex         WHERE id_almacen  NOT IN (SELECT id FROM almacenes);
DELETE FROM kardex         WHERE id_empresa  NOT IN (SELECT id FROM empresa);
DELETE FROM almacen        WHERE id_almacen  NOT IN (SELECT id FROM almacenes);
DELETE FROM almacen        WHERE id_producto NOT IN (SELECT id FROM productos);
DELETE FROM almacenes      WHERE id_empresa  NOT IN (SELECT id FROM empresa);
DELETE FROM productos      WHERE id_empresa  NOT IN (SELECT id FROM empresa);
DELETE FROM ventas         WHERE id_empresa  NOT IN (SELECT id FROM empresa);
-- Proteger superadmin al limpiar usuarios huérfanos
DELETE FROM usuarios
  WHERE id_empresa NOT IN (SELECT id FROM empresa)
    AND tipo != 'superadmin';


-- ── PARTE 3: FOREIGN KEYS CON CASCADE ────────────────────────────

DO $$
BEGIN

  -- almacen (stock) → almacenes (bodega)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_almacen_almacenes' AND table_name = 'almacen')
  THEN ALTER TABLE almacen ADD CONSTRAINT fk_almacen_almacenes
    FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE CASCADE; END IF;

  -- almacen (stock) → productos
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_almacen_producto' AND table_name = 'almacen')
  THEN ALTER TABLE almacen ADD CONSTRAINT fk_almacen_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE; END IF;

  -- almacen (stock) → sucursales
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_almacen_sucursal' AND table_name = 'almacen')
  THEN ALTER TABLE almacen ADD CONSTRAINT fk_almacen_sucursal
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE CASCADE; END IF;

  -- almacenes (bodega) → empresa
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_almacenes_empresa' AND table_name = 'almacenes')
  THEN ALTER TABLE almacenes ADD CONSTRAINT fk_almacenes_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE; END IF;

  -- almacenes (bodega) → sucursales
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_almacenes_sucursal' AND table_name = 'almacenes')
  THEN ALTER TABLE almacenes ADD CONSTRAINT fk_almacenes_sucursal
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE CASCADE; END IF;

  -- sucursales → empresa
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sucursales_empresa' AND table_name = 'sucursales')
  THEN ALTER TABLE sucursales ADD CONSTRAINT fk_sucursales_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE; END IF;

  -- usuarios → empresa
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_usuarios_empresa' AND table_name = 'usuarios')
  THEN ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE; END IF;

  -- usuarios → sucursales (nullable → SET NULL)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_usuarios_sucursal' AND table_name = 'usuarios')
  THEN ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_sucursal
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL; END IF;

  -- productos → empresa
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_productos_empresa' AND table_name = 'productos')
  THEN ALTER TABLE productos ADD CONSTRAINT fk_productos_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE; END IF;

  -- kardex → empresa
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_kardex_empresa' AND table_name = 'kardex')
  THEN ALTER TABLE kardex ADD CONSTRAINT fk_kardex_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE; END IF;

  -- kardex → almacenes (bodega)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_kardex_almacen' AND table_name = 'kardex')
  THEN ALTER TABLE kardex ADD CONSTRAINT fk_kardex_almacen
    FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE CASCADE; END IF;

  -- kardex → productos
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_kardex_producto' AND table_name = 'kardex')
  THEN ALTER TABLE kardex ADD CONSTRAINT fk_kardex_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE; END IF;

  -- ventas → empresa
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_ventas_empresa' AND table_name = 'ventas')
  THEN ALTER TABLE ventas ADD CONSTRAINT fk_ventas_empresa
    FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE; END IF;

  -- ventas → almacenes (SET NULL para no perder ventas si borra bodega)
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_ventas_almacen' AND table_name = 'ventas')
  THEN ALTER TABLE ventas ADD CONSTRAINT fk_ventas_almacen
    FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE SET NULL; END IF;

  -- detalle_ventas → ventas
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_detalle_venta' AND table_name = 'detalle_ventas')
  THEN ALTER TABLE detalle_ventas ADD CONSTRAINT fk_detalle_venta
    FOREIGN KEY (id_venta) REFERENCES ventas(id) ON DELETE CASCADE; END IF;

  -- detalle_ventas → productos
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_detalle_producto' AND table_name = 'detalle_ventas')
  THEN ALTER TABLE detalle_ventas ADD CONSTRAINT fk_detalle_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE; END IF;

  -- sesiones_caja → almacenes
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_sesiones_almacen' AND table_name = 'sesiones_caja')
  THEN ALTER TABLE sesiones_caja ADD CONSTRAINT fk_sesiones_almacen
    FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE CASCADE; END IF;

END $$;


-- ── PARTE 4: VISTAS HUB ───────────────────────────────────────────

-- Hub 1: Inventario completo con jerarquía completa
CREATE OR REPLACE VIEW vista_inventario_hub AS
SELECT
    e.id            AS id_empresa,
    e.razon_social  AS empresa,
    s.id            AS id_sucursal,
    al.id           AS id_almacen,
    al.nombre       AS almacen,
    p.id            AS id_producto,
    p.nombre        AS producto,
    p.precio_venta,
    p.maneja_inventarios,
    stk.stock,
    stk.stock_minimo,
    stk.id          AS id_stock,
    CASE
        WHEN stk.stock IS NULL OR stk.stock <= 0 THEN 'agotado'
        WHEN stk.stock <= stk.stock_minimo        THEN 'bajo'
        ELSE                                           'normal'
    END AS estado_stock
FROM empresa e
JOIN sucursales s      ON s.id_empresa   = e.id
JOIN almacenes al      ON al.id_sucursal = s.id
LEFT JOIN almacen stk  ON stk.id_almacen = al.id
LEFT JOIN productos p   ON p.id          = stk.id_producto;

-- Hub 2: Kardex con contexto completo (sin JOINs manuales)
CREATE OR REPLACE VIEW vista_kardex_hub AS
SELECT
    k.id,
    k.created_at,
    e.razon_social                        AS empresa,
    al.nombre                             AS almacen,
    k.nombre_producto,
    k.tipo,
    k.cantidad,
    k.stock_anterior,
    k.stock_nuevo,
    k.descripcion,
    COALESCE(u.nombres, u.usuario, '—')   AS usuario,
    k.id_empresa,
    k.id_sucursal,
    k.id_almacen,
    k.id_producto,
    k.id_usuario,
    k.id_venta
FROM kardex k
LEFT JOIN empresa e    ON e.id  = k.id_empresa
LEFT JOIN almacenes al ON al.id = k.id_almacen
LEFT JOIN usuarios u   ON u.id  = k.id_usuario;

-- Hub 3: Ventas con contexto completo
CREATE OR REPLACE VIEW vista_ventas_hub AS
SELECT
    v.id,
    v.created_at,
    e.razon_social                        AS empresa,
    al.nombre                             AS almacen,
    v.total,
    v.subtotal,
    v.iva,
    v.metodo_pago,
    COALESCE(u.nombres, u.usuario, '—')   AS vendedor,
    v.id_empresa,
    v.id_sucursal,
    v.id_almacen,
    v.id_usuario
FROM ventas v
LEFT JOIN empresa e    ON e.id  = v.id_empresa
LEFT JOIN almacenes al ON al.id = v.id_almacen
LEFT JOIN usuarios u   ON u.id  = v.id_usuario;


-- ── PARTE 5: ÍNDICES DE PERFORMANCE ─────────────────────────────

CREATE INDEX IF NOT EXISTS idx_almacen_id_almacen      ON almacen(id_almacen);
CREATE INDEX IF NOT EXISTS idx_almacen_id_producto      ON almacen(id_producto);
CREATE INDEX IF NOT EXISTS idx_kardex_empresa_almacen   ON kardex(id_empresa, id_almacen);
CREATE INDEX IF NOT EXISTS idx_kardex_created_at        ON kardex(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa           ON ventas(id_empresa);
CREATE INDEX IF NOT EXISTS idx_productos_empresa        ON productos(id_empresa);
CREATE INDEX IF NOT EXISTS idx_almacenes_empresa        ON almacenes(id_empresa);
CREATE INDEX IF NOT EXISTS idx_almacenes_sucursal       ON almacenes(id_sucursal);
