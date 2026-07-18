-- Módulo Suministros (insumos de cocina)
-- Ejecutar en Supabase: proyecto souwqzfmxsorhelmidqq

CREATE TABLE IF NOT EXISTS suministros (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa      INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    nombre          TEXT    NOT NULL,
    unidad          TEXT    DEFAULT 'unidades',
    stock_actual    NUMERIC DEFAULT 0,
    stock_minimo    NUMERIC DEFAULT 0,
    precio_promedio NUMERIC DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compras_suministros (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa     INTEGER NOT NULL REFERENCES empresa(id) ON DELETE CASCADE,
    id_suministro  UUID    NOT NULL REFERENCES suministros(id) ON DELETE CASCADE,
    cantidad       NUMERIC NOT NULL,
    precio_total   NUMERIC NOT NULL,
    proveedor      TEXT,
    fecha          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE suministros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_suministros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_suministros"         ON suministros;
DROP POLICY IF EXISTS "tenant_compras_suministros" ON compras_suministros;

CREATE POLICY "tenant_suministros" ON suministros
    USING (id_empresa = get_mi_empresa());

CREATE POLICY "tenant_compras_suministros" ON compras_suministros
    USING (id_empresa = get_mi_empresa());
