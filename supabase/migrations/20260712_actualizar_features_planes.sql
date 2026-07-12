-- Actualiza las features de los planes en la DB para reflejar los nuevos límites.
-- Ejecutar en Supabase SQL Editor.
-- Chispa: 1 almacén · 2 usuarios
-- Fuego:  3 almacenes · 6 usuarios
-- Cosmos: 6 almacenes · 12 usuarios · +$100.000 por almacén adicional

UPDATE config_planes
SET features = '[
  {"label": "1 almacén",                        "activo": true},
  {"label": "Hasta 2 usuarios",                  "activo": true},
  {"label": "Punto de venta (POS)",              "activo": true},
  {"label": "Inventario básico",                 "activo": true},
  {"label": "Reportes básicos",                  "activo": true},
  {"label": "Soporte por WhatsApp",              "activo": true},
  {"label": "Kardex y trazabilidad",             "activo": false},
  {"label": "Multi-sucursal",                    "activo": false}
]'::jsonb
WHERE tier = 'chispa';

UPDATE config_planes
SET features = '[
  {"label": "Hasta 3 almacenes",                "activo": true},
  {"label": "Hasta 6 usuarios",                 "activo": true},
  {"label": "POS con roles completos",           "activo": true},
  {"label": "Inventario avanzado",               "activo": true},
  {"label": "Kardex y trazabilidad",             "activo": true},
  {"label": "Reportes en tiempo real",           "activo": true},
  {"label": "Multi-sucursal",                    "activo": true},
  {"label": "Ticket personalizado",              "activo": true},
  {"label": "Soporte prioritario",               "activo": true}
]'::jsonb
WHERE tier = 'fuego';

UPDATE config_planes
SET features = '[
  {"label": "Hasta 6 almacenes",                "activo": true},
  {"label": "Hasta 12 usuarios",                "activo": true},
  {"label": "Todo el plan Fuego",               "activo": true},
  {"label": "App móvil optimizada",             "activo": true},
  {"label": "Onboarding personalizado",         "activo": true},
  {"label": "Soporte dedicado 24/7",            "activo": true},
  {"label": "SLA garantizado 99.9%",            "activo": true},
  {"label": "Respuesta en < 2 horas",           "activo": true},
  {"label": "+$100.000/mes por almacén extra",  "activo": true}
]'::jsonb
WHERE tier = 'cosmos';
