// Genera una contraseña aleatoria segura (sin caracteres ambiguos: 0/O, 1/I/l)
export function generatePassword(length = 12) {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

// PBKDF2 con sal aleatoria — mucho más seguro que SHA-256 puro.
// Formato de salida: "pbkdf2:<sal_hex>:<hash_hex>"
export async function hashPassword(plain) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(String(plain)),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 },
        key,
        256
    );
    const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    return `pbkdf2:${toHex(salt)}:${toHex(bits)}`;
}
