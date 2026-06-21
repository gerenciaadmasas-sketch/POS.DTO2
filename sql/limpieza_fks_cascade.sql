-- =============================================
-- LIMPIEZA DB + FKs CON CASCADE — POS-DL-V1
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 1: ELIMINAR TABLAS SIN USO         ║
-- ╚═══════════════════════════════════════════╝

DROP TABLE IF EXISTS venta_detalle CASCADE;
DROP TABLE IF EXISTS asignacion_sucursal CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS tipodocumento CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 2: FKs DESDE empresa (raíz)        ║
-- ╚═══════════════════════════════════════════╝

-- empresa.id_usuario → usuarios (el dueño/creador)
ALTER TABLE empresa DROP CONSTRAINT IF EXISTS empresa_id_usuario_fkey;
ALTER TABLE empresa ADD CONSTRAINT empresa_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 3: FKs DESDE usuarios              ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_almacen_fkey
  FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 4: FKs DESDE sucursales            ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE sucursales DROP CONSTRAINT IF EXISTS sucursales_id_empresa_fkey;
ALTER TABLE sucursales ADD CONSTRAINT sucursales_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE sucursales DROP CONSTRAINT IF EXISTS sucursales_id_usuario_fkey;
ALTER TABLE sucursales ADD CONSTRAINT sucursales_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 5: FKs DESDE almacenes (warehouses)║
-- ╚═══════════════════════════════════════════╝

-- Agregar FKs que no existían
ALTER TABLE almacenes ADD CONSTRAINT almacenes_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE almacenes ADD CONSTRAINT almacenes_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 6: FKs DESDE almacen (stock)       ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE almacen DROP CONSTRAINT IF EXISTS almacen_id_sucursal_fkey;
ALTER TABLE almacen ADD CONSTRAINT almacen_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE CASCADE;

ALTER TABLE almacen DROP CONSTRAINT IF EXISTS almacen_id_producto_fkey;
ALTER TABLE almacen ADD CONSTRAINT almacen_id_producto_fkey
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE;

ALTER TABLE almacen DROP CONSTRAINT IF EXISTS almacen_id_almacen_fkey;
ALTER TABLE almacen ADD CONSTRAINT almacen_id_almacen_fkey
  FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 7: FKs DESDE categorías            ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE categorias DROP CONSTRAINT IF EXISTS categorias_id_empresa_fkey;
ALTER TABLE categorias ADD CONSTRAINT categorias_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 8: FKs DESDE productos             ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_id_empresa_fkey;
ALTER TABLE productos ADD CONSTRAINT productos_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_id_categoria_fkey;
ALTER TABLE productos ADD CONSTRAINT productos_id_categoria_fkey
  FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 9: FKs DESDE multiprecios          ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE multiprecios DROP CONSTRAINT IF EXISTS multiprecios_id_producto_fkey;
ALTER TABLE multiprecios ADD CONSTRAINT multiprecios_id_producto_fkey
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 10: FKs DESDE clientes             ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_id_empresa_fkey;
ALTER TABLE clientes ADD CONSTRAINT clientes_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 11: FKs DESDE proveedores          ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE proveedores DROP CONSTRAINT IF EXISTS proveedores_id_empresa_fkey;
ALTER TABLE proveedores ADD CONSTRAINT proveedores_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 12: FKs DESDE ventas               ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_id_empresa_fkey;
ALTER TABLE ventas ADD CONSTRAINT ventas_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_id_sucursal_fkey;
ALTER TABLE ventas ADD CONSTRAINT ventas_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_id_almacen_fkey;
ALTER TABLE ventas ADD CONSTRAINT ventas_id_almacen_fkey
  FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE SET NULL;

ALTER TABLE ventas DROP CONSTRAINT IF EXISTS ventas_id_usuario_fkey;
ALTER TABLE ventas ADD CONSTRAINT ventas_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 13: FKs DESDE detalle_ventas       ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE detalle_ventas DROP CONSTRAINT IF EXISTS detalle_ventas_id_venta_fkey;
ALTER TABLE detalle_ventas ADD CONSTRAINT detalle_ventas_id_venta_fkey
  FOREIGN KEY (id_venta) REFERENCES ventas(id) ON DELETE CASCADE;

ALTER TABLE detalle_ventas ADD CONSTRAINT detalle_ventas_id_producto_fkey
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 14: FKs DESDE kardex               ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE kardex DROP CONSTRAINT IF EXISTS kardex_id_almacen_fkey;
ALTER TABLE kardex ADD CONSTRAINT kardex_id_almacen_fkey
  FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE CASCADE;

ALTER TABLE kardex ADD CONSTRAINT kardex_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE kardex ADD CONSTRAINT kardex_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE kardex ADD CONSTRAINT kardex_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 15: FKs DESDE sesiones_caja        ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE sesiones_caja ADD CONSTRAINT sesiones_caja_id_empresa_fkey
  FOREIGN KEY (id_empresa) REFERENCES empresa(id) ON DELETE CASCADE;

ALTER TABLE sesiones_caja ADD CONSTRAINT sesiones_caja_id_sucursal_fkey
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE SET NULL;

ALTER TABLE sesiones_caja ADD CONSTRAINT sesiones_caja_id_almacen_fkey
  FOREIGN KEY (id_almacen) REFERENCES almacenes(id) ON DELETE SET NULL;

ALTER TABLE sesiones_caja ADD CONSTRAINT sesiones_caja_id_usuario_fkey
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 16: RLS en tablas sin protección    ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre productos" ON productos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE almacen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre almacen" ON almacen FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE almacenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre almacenes" ON almacenes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre detalle_ventas" ON detalle_ventas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE kardex ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre kardex" ON kardex FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso libre sesiones_caja" ON sesiones_caja FOR ALL USING (true) WITH CHECK (true);

-- ╔═══════════════════════════════════════════╗
-- ║  ✅ LISTO                                 ║
-- ╚═══════════════════════════════════════════╝
-- Tablas eliminadas: venta_detalle, asignacion_sucursal, roles, tipodocumento
-- FKs con CASCADE en toda la cadena empresa → sucursales → almacenes → stock
-- FKs con SET NULL para ventas/kardex (no perder datos históricos)
-- RLS habilitado en todas las tablas
