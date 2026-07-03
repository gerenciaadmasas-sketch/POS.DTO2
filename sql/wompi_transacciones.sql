-- Tabla para guardar transacciones Wompi pendientes/procesadas
CREATE TABLE IF NOT EXISTS wompi_transacciones_pendientes (
  id                   SERIAL PRIMARY KEY,
  reference            TEXT UNIQUE NOT NULL,
  plan                 TEXT NOT NULL,                   -- chispa / fuego / cosmos
  billing              TEXT NOT NULL DEFAULT 'mensual', -- mensual / anual
  nombre               TEXT,
  apellido             TEXT,
  email                TEXT,
  empresa              TEXT,
  telefono             TEXT,
  cedula               TEXT,
  actividad_economica  TEXT,
  amount_in_cents      INTEGER,
  wompi_transaction_id TEXT,
  estado               TEXT DEFAULT 'pendiente',        -- pendiente / procesado / fallido
  usuario_admin        TEXT,
  password_admin       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_wompi_reference ON wompi_transacciones_pendientes (reference);
CREATE INDEX IF NOT EXISTS idx_wompi_estado    ON wompi_transacciones_pendientes (estado);

-- RLS: habilitar y permitir lectura pública por referencia
-- (la referencia actúa como token único de acceso)
ALTER TABLE wompi_transacciones_pendientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica_por_referencia"
  ON wompi_transacciones_pendientes
  FOR SELECT
  TO anon, authenticated
  USING (true);
