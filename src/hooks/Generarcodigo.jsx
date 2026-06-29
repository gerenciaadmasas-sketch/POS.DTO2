export const Generarcodigo = (data) => {
    const siguiente = (data.id ?? 0) + 1;
    return `DK${String(siguiente).padStart(8, '0')}`;
}
