export const Generarcodigo = (data) => {
    const idProducto = String(data.id + 1).padStart(4, '0');
    let randomCode = "";
    for (let i = 0; i < 8; i++) {
        randomCode += Math.floor(Math.random() * 10).toString();
    }
    const codigoBase = randomCode + idProducto; // 12 dígitos
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(codigoBase[i]) * (i % 2 === 0 ? 1 : 3);
    const checksum = (10 - (sum % 10)) % 10;
    return codigoBase + checksum.toString(); // 13 dígitos
}
