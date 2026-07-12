-- Función que verifica si un visitante ya tiene suscripción POS activa
-- y retorna el porcentaje de descuento que aplica en el servicio web.
-- Cosmos → 35% | Fuego → 25% | Chispa/ninguna → 0%

CREATE OR REPLACE FUNCTION public.get_descuento_web(p_usuario text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_empresa bigint;
  v_plan       text;
BEGIN
  SELECT id_empresa INTO v_id_empresa
  FROM usuarios
  WHERE usuario = p_usuario
  LIMIT 1;

  IF v_id_empresa IS NULL THEN
    RETURN jsonb_build_object('encontrado', false);
  END IF;

  SELECT tipo_plan INTO v_plan
  FROM suscripciones
  WHERE id_empresa = v_id_empresa
    AND estado = 'al_dia'
  ORDER BY id DESC
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object('encontrado', true, 'tiene_descuento', false, 'plan', null);
  END IF;

  RETURN jsonb_build_object(
    'encontrado',      true,
    'tiene_descuento', v_plan IN ('fuego', 'cosmos'),
    'plan',            v_plan,
    'porcentaje',      CASE v_plan
                         WHEN 'cosmos' THEN 35
                         WHEN 'fuego'  THEN 25
                         ELSE 0
                       END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_descuento_web(text) TO anon, authenticated;
