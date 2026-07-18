export async function hashPassword(plain) {
    const data = new TextEncoder().encode(String(plain));
    const buf  = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}
