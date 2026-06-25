-- =============================================
-- MIGRACIÓN INVENTARIO DIKEI — LOCAL FIT
-- Ejecutar en Supabase SQL Editor
-- 162 productos, 13 categorías
-- =============================================

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 1: Agregar created_at a productos  ║
-- ╚═══════════════════════════════════════════╝

ALTER TABLE productos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 2: Sucursal + 3 Almacenes          ║
-- ╚═══════════════════════════════════════════╝

DO $$
DECLARE
    v_empresa BIGINT;
    v_sucursal BIGINT;
BEGIN
    SELECT id INTO v_empresa FROM empresa LIMIT 1;

    -- Crear sucursal Noroccidente (si no existe)
    INSERT INTO sucursales (id_empresa, razon_social, direccion)
    VALUES (v_empresa, 'Noroccidente', 'Bogotá - Noroccidente')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_sucursal FROM sucursales
    WHERE id_empresa = v_empresa AND razon_social = 'Noroccidente' LIMIT 1;

    -- Crear 3 almacenes
    INSERT INTO almacenes (id_empresa, id_sucursal, nombre)
    VALUES
        (v_empresa, v_sucursal, 'Fit'),
        (v_empresa, v_sucursal, 'Urbano'),
        (v_empresa, v_sucursal, 'Milkositas')
    ON CONFLICT DO NOTHING;
END $$;

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 3: Categorías                      ║
-- ╚═══════════════════════════════════════════╝

INSERT INTO categorias (nombre, id_empresa)
SELECT cat, (SELECT id FROM empresa LIMIT 1)
FROM (VALUES
    ('Accesorios'),
    ('Inferior Dama'),
    ('Superior Dama'),
    ('Superior Hombre'),
    ('Inferior Hombre'),
    ('Conjuntos'),
    ('Chaqueta Dama'),
    ('Chaqueta Hombre'),
    ('Fútbol'),
    ('Enterizos'),
    ('Leggins'),
    ('Ciclismo'),
    ('Natación')
) AS t(cat)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias c
    WHERE c.nombre = t.cat AND c.id_empresa = (SELECT id FROM empresa LIMIT 1)
);

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 4: Productos (162)                 ║
-- ╚═══════════════════════════════════════════╝

-- Tabla temporal para cargar los datos crudos
CREATE TEMP TABLE tmp_productos (
    nombre TEXT,
    categoria TEXT,
    cantidad INTEGER,
    precio_compra NUMERIC,
    precio_venta NUMERIC
);

INSERT INTO tmp_productos (nombre, categoria, cantidad, precio_compra, precio_venta) VALUES
('Bolsa', NULL, 68, 300, 300),
('Camiseta azul colombia 1.1', NULL, 0, 45000, 95000),
('Fit antideslizante', 'Accesorios', 1, 8000, 22000),
('FIT Balaca deportiva', 'Accesorios', 0, 15000, 30000),
('FIT Bicicletero microfibra degradé', 'Inferior Dama', 2, 18000, 42000),
('FIT Bicicletero microfibra liso', 'Inferior Dama', 6, 12000, 35000),
('FIT Bicicletero microfibra marmolizado', 'Inferior Dama', 6, 18000, 42000),
('FIT Bicicletero microfibra V', 'Inferior Dama', 1, 18000, 44000),
('FIT Bicicletero power', 'Inferior Dama', 6, 9000, 26000),
('FIT Bicishort licra', 'Inferior Dama', 4, 15000, 38000),
('FIT Bicishort malla', 'Inferior Dama', 4, 15000, 39000),
('FIT Bicishort runing', 'Inferior Dama', 1, 20000, 48000),
('FIT Bicishort running pro', 'Inferior Dama', 4, 25000, 54000),
('FIT Blusa aura', 'Superior Dama', 1, 12000, 34000),
('FIT Braga', 'Conjuntos', 3, 20000, 59000),
('FIT Buso motero', 'Superior Hombre', 3, 55000, 117000),
('FIT Buzo ambar', 'Superior Dama', 9, 11000, 36000),
('FIT Buzo atlas', 'Superior Hombre', 22, 16000, 42000),
('FIT Buzo capotero bacher', 'Superior Dama', 4, 18000, 74000),
('FIT Buzo class', 'Superior Hombre', 7, 24000, 55000),
('FIT Buzo malla', 'Superior Dama', 1, 20000, 50000),
('FIT buzo pro', 'Superior Dama', 3, 25000, 58000),
('FIT Buzo redondo', 'Superior Dama', 6, 16000, 48000),
('FIT Buzo TENFIT M/L', 'Superior Hombre', 11, 22000, 55000),
('FIT Calentadoras', 'Accesorios', 3, 8500, 20000),
('FIT Camiseta algodon', 'Superior Hombre', 4, 11000, 29000),
('FIT camiseta colombia infantil', 'Fútbol', 0, 15000, 33000),
('FIT Camiseta corta', 'Superior Dama', 3, 10000, 29000),
('FIT Camiseta dakota', 'Superior Dama', 11, 10000, 29000),
('FIT Camiseta dakota plus', 'Superior Dama', 2, 13000, 34000),
('FIT Camiseta delta', 'Superior Hombre', 9, 13000, 34000),
('FIT Camiseta ivanka', 'Superior Dama', 3, 10000, 29000),
('FIT Camiseta jazmin', 'Superior Dama', 8, 80000, 29000),
('FIT Camiseta Luna', 'Superior Dama', 5, 10000, 29000),
('FIT Camiseta Luna plus', 'Superior Dama', 3, 13000, 34000),
('FIT Camiseta over beisbolera', 'Superior Hombre', 2, 20000, 52000),
('FIT camiseta over dama', 'Superior Dama', 5, 18000, 42000),
('FIT Camiseta over mundial', 'Superior Hombre', 1, 20000, 44000),
('FIT Camiseta TENFIT m/c', 'Superior Hombre', 5, 20000, 52000),
('FIT Canillera futbol', 'Accesorios', 0, 0, 20000),
('FIT Capry hombre', 'Inferior Hombre', 6, 18000, 40000),
('FIT Chaqueta Ana dama', 'Chaqueta Dama', 7, 15000, 39000),
('FIT Chaqueta arcoiris dama', 'Chaqueta Dama', 4, 20000, 49000),
('FIT Chaqueta bolsillo', 'Chaqueta Hombre', 6, 30000, 73000),
('FIT Chaqueta croptop abierto dama', 'Chaqueta Dama', 7, 24000, 60000),
('FIT Chaqueta Croptop dama', 'Chaqueta Dama', 4, 18000, 44000),
('FIT chaqueta futbol', 'Chaqueta Hombre', 0, 35000, 78000),
('FIT Chaqueta nini', 'Chaqueta Dama', 4, 55000, 57000),
('FIT Chaqueta reflectiva dama', 'Chaqueta Dama', 3, 20000, 71000),
('FIT Chaqueta reflectiva hombre', 'Chaqueta Hombre', 2, 33000, 71000),
('FIT Chaqueta robótica dama', 'Chaqueta Dama', 2, 33000, 78000),
('FIT Chaqueta robotica hombre', 'Chaqueta Hombre', 1, 33000, 78000),
('FIT Chaqueta robotica triangulo dama', 'Chaqueta Dama', 0, 27000, 63000),
('FIT Chaqueta tres bolsillos', 'Chaqueta Hombre', 14, 21000, 52000),
('FIT Chaqueta triangulo hombre', 'Chaqueta Hombre', 2, 27000, 63000),
('FIT Colombia 1.1', 'Fútbol', 8, 50000, 95000),
('FIT Colombia 100años 1.1', 'Fútbol', 0, 30000, 115000),
('FIT Colombia AAA', 'Fútbol', 16, 38000, 72000),
('FIT Colombia azúl AAA', 'Fútbol', 4, 30000, 88000),
('FIT Colombia retro', 'Fútbol', 1, 35000, 50000),
('FIT Conjunto lion pantalóneta', 'Conjuntos', 1, 0, 127000),
('FIT Conjunto marmolizado', 'Conjuntos', 1, 32000, 75000),
('FIT Conjunto premium Polo', 'Conjuntos', 0, 39500, 97000),
('FIT Conjunto premium short', 'Conjuntos', 1, 34900, 85000),
('Fit conjunto shein', 'Conjuntos', 1, 0, 68000),
('FIT Conjunto shorts microfibra', 'Conjuntos', 2, 15000, 38000),
('FIT Conjunto tex', NULL, 1, 55000, 104000),
('FIT Conjunto vers', 'Conjuntos', 1, 12000, 35000),
('FIT crotop cremallera', 'Superior Dama', 6, 19000, 42000),
('Fit Ent manga corta', 'Enterizos', 1, 0, 106000),
('Fit Ent. M/L short', NULL, 2, 0, 94000),
('Fit Ent. Premium Sisa', 'Enterizos', 8, 0, 98000),
('FIT Enterizo cruz', 'Enterizos', 2, 22000, 60000),
('FIT Enterizo short yoga', 'Enterizos', 7, 25000, 50000),
('FIT enterizo shorts bomba', 'Enterizos', 3, 32000, 78000),
('FIT enterizo shorts premium', 'Enterizos', 2, 40000, 98000),
('FIT Enterizo suplex', 'Enterizos', 1, 35000, 75000),
('FIT Enterizo tenfit falda', 'Enterizos', 1, 50000, 105000),
('FIT Enterizo yoga', 'Enterizos', 0, 40000, 86000),
('FIT Esqueleto capota', 'Superior Hombre', 9, 16000, 42000),
('FIT Esqueleto jump', 'Superior Dama', 4, 12000, 32000),
('FIT Esqueleto mariposa', 'Superior Hombre', 3, 14000, 39000),
('FIT Esqueleto over sisa', 'Superior Hombre', 4, 24000, 56000),
('FIT Esqueleto sisa', 'Superior Hombre', 10, 16000, 41000),
('FIT Esqueleto súper sisa', 'Superior Hombre', 9, 14000, 40000),
('FIT Falda Corta', 'Inferior Dama', 7, 12000, 38000),
('FIT Falda larga', 'Inferior Dama', 9, 15000, 38000),
('FIT Falda tennis', 'Inferior Dama', 7, 18000, 44000),
('FIT Gorra', 'Accesorios', 31, 8000, 24000),
('FIT Gorro ciclismo', 'Ciclismo', 4, 8000, 22000),
('FIT Guante ciclismo', 'Accesorios', 1, 0, 30000),
('FIT Guante eco', 'Accesorios', 1, 10000, 20000),
('FIT Guantes Gym', 'Accesorios', 6, 18000, 45000),
('FIT Jersey marcas', 'Ciclismo', 2, 40000, 88000),
('FIT Jogger skinny', 'Inferior Hombre', 22, 25000, 59000),
('FIT Leggins black', 'Leggins', 2, 16000, 46000),
('FIT Leggins bolsillo', 'Leggins', 2, 25000, 58000),
('FIT Leggins campana', 'Leggins', 1, 20000, 58000),
('FIT Leggins golden', 'Leggins', 5, 16000, 48000),
('FIT Leggins kirius', 'Leggins', 5, 33000, 74000),
('FIT Leggins pacific', 'Leggins', 3, 18000, 48000),
('FIT Leggins superlicra', 'Leggins', 13, 20000, 48000),
('FIT Leggins superlicra velo', 'Leggins', 1, 18000, 46000),
('FIT Leggins tenfit', 'Leggins', 14, 33000, 74000),
('FIT Leggins termico', 'Leggins', 2, 16000, 48000),
('FIT Leggins tex clasico', 'Leggins', 2, 18000, 48000),
('FIT Leggins velo', 'Leggins', 4, 14000, 40000),
('FIT Leggins yoga degradé', 'Leggins', 3, 20000, 48000),
('FIT Leggins yoga láser', 'Leggins', 4, 20000, 48000),
('FIT Leggins yoga liso', 'Leggins', 11, 20000, 48000),
('FIT Leggins yoga mármol degradé', 'Leggins', 1, 20000, 48000),
('FIT Leggins yoga marmolizado', 'Leggins', 6, 20000, 48000),
('FIT LG bolsillo pro', 'Leggins', 4, 14000, 40000),
('FIT Licra army', 'Inferior Hombre', 8, 16000, 49000),
('FIT Licra Forza', 'Inferior Hombre', 11, 13000, 39000),
('FIT Madisson', 'Superior Dama', 7, 20000, 50000),
('FIT Medias', 'Accesorios', 18, 7500, 19000),
('FIT Medias futbol', 'Accesorios', 2, 8000, 20000),
('FIT Palazo', 'Inferior Hombre', 4, 25000, 59000),
('FIT Pantalón over', 'Inferior Hombre', 5, 30000, 65000),
('FIT Pantaloneta Burda', 'Inferior Hombre', 10, 19000, 49000),
('FIT pantaloneta burda corta', 'Inferior Hombre', 2, 22000, 47000),
('FIT Pantaloneta con licra', 'Inferior Hombre', 8, 24000, 52000),
('FIT Pantaloneta de baño', 'Natación', 12, 12000, 32000),
('FIT Pantaloneta microfibra', 'Inferior Hombre', 7, 20000, 55000),
('FIT pantaloneta nautica', 'Inferior Hombre', 7, 18000, 40000),
('FIT Pantaloneta playera', 'Inferior Hombre', 3, 21000, 50000),
('FIT pantaloneta running pro', 'Inferior Hombre', 0, 29000, 64000),
('FIT roja 1A', 'Fútbol', 1, 55000, 105000),
('FIT Salida pantalón', 'Natación', 1, 20000, 42000),
('FIT Salida pantalón ala', NULL, 1, 22000, 45000),
('FIT Salida short', 'Natación', 1, 12000, 30000),
('FIT shorts microfibra recogido', 'Inferior Dama', 6, 12000, 42000),
('FIT sudadera caballeo', 'Conjuntos', 5, 50000, 112000),
('FIT sudadera dama corta', 'Conjuntos', 3, 45000, 98000),
('FIT Top botón', 'Superior Dama', 2, 12000, 31000),
('FIT top Brooklyn', NULL, 0, 0, 15000),
('FIT Top microfibra', 'Superior Dama', 2, 8000, 22000),
('FIT Top tenfit', 'Superior Dama', 16, 13000, 34000),
('FIT Top velo', 'Superior Dama', 4, 10000, 24000),
('FIT top volado', 'Superior Dama', 5, 13000, 33000),
('FIT Torero power', 'Inferior Dama', 6, 9000, 29000),
('FIT Tula', 'Accesorios', 1, 6000, 19000),
('FIT uniforme futbol', 'Fútbol', 13, 35000, 72000),
('FIT Vestido enterizo copa', 'Natación', 1, 42000, 98000),
('FIT vestido 2 pz copa', 'Natación', 2, 35000, 83000),
('FIT Vestido aro', 'Natación', 3, 30000, 78000),
('FIT Vestido asoleador', 'Natación', 6, 25000, 62000),
('FIT Vestido bolero', 'Natación', 2, 28000, 67000),
('FIT Vestido bronceador', 'Natación', 1, 25000, 50000),
('FIT Vestido cadena', 'Natación', 3, 30000, 72000),
('FIT Vestido copa', NULL, 2, 37000, 81000),
('FIT Vestido corset', 'Natación', 2, 28000, 60000),
('FIT Vestido cruzado', 'Natación', 2, 28000, 67000),
('FIT Vestido manga larga', 'Natación', 3, 36000, 88000),
('FIT Vestido mariposa', 'Natación', 1, 30000, 68000),
('FIT Vestido premium', 'Natación', 1, 38000, 84000),
('FIT Vestido teens', 'Natación', 3, 35000, 84000),
('FIT Vintage', 'Inferior Hombre', 6, 14000, 38000),
('Leggins costillero', 'Leggins', 4, 25000, 58000),
('Skinny unica', 'Inferior Hombre', 6, 18000, 45000),
('Uniforme infantil AAA', 'Fútbol', 3, 35000, 77000);

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 5: Insertar en productos reales    ║
-- ╚═══════════════════════════════════════════╝

INSERT INTO productos (nombre, precio_compra, precio_venta, id_categoria, id_empresa, maneja_inventarios, created_at)
SELECT
    t.nombre,
    t.precio_compra,
    t.precio_venta,
    c.id,
    (SELECT id FROM empresa LIMIT 1),
    true,
    NOW()
FROM tmp_productos t
LEFT JOIN categorias c ON c.nombre = t.categoria
    AND c.id_empresa = (SELECT id FROM empresa LIMIT 1);

-- ╔═══════════════════════════════════════════╗
-- ║  PASO 6: Stock en almacén FIT            ║
-- ╚═══════════════════════════════════════════╝

INSERT INTO almacen (id_sucursal, id_producto, stock, stock_minimo, id_almacen)
SELECT
    (SELECT id FROM sucursales WHERE razon_social = 'Noroccidente' LIMIT 1),
    p.id,
    t.cantidad,
    0,
    (SELECT id FROM almacenes WHERE nombre = 'Fit' LIMIT 1)
FROM tmp_productos t
JOIN productos p ON p.nombre = t.nombre
    AND p.id_empresa = (SELECT id FROM empresa LIMIT 1)
WHERE t.cantidad > 0;

-- Limpiar tabla temporal
DROP TABLE tmp_productos;

-- ╔═══════════════════════════════════════════╗
-- ║  ✅ RESUMEN                               ║
-- ╚═══════════════════════════════════════════╝
-- 1. created_at agregado a productos
-- 2. Sucursal: Noroccidente
-- 3. Almacenes: Fit, Urbano, Milkositas
-- 4. 13 categorías creadas
-- 5. 162 productos migrados con precio_compra y precio_venta
-- 6. Stock asignado al almacén Fit
