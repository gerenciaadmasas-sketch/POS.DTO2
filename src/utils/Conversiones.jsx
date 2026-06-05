
export function ConvertirCapitalize(input) {
  return (input.charAt(0).toUpperCase()+input.slice(1).toLowerCase());
}

export function FormatearCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor ?? 0);
}