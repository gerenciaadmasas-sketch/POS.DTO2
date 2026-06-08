import Swal from "sweetalert2";

const base = Swal.mixin({
    toast: true,
    position: "top-right",
    showConfirmButton: false,
    timerProgressBar: true,
    didOpen: (t) => {
        t.addEventListener("mouseenter", Swal.stopTimer);
        t.addEventListener("mouseleave", Swal.resumeTimer);
    },
});

const html = (contexto, mensaje) => `
    <div style="text-align:left;line-height:1.5">
        ${contexto ? `<div style="font-size:11px;opacity:0.65;margin-bottom:2px">📍 ${contexto}</div>` : ""}
        <div style="font-size:14px;font-weight:600">${mensaje}</div>
    </div>
`;

export const toastExito = (mensaje, contexto = "") =>
    base.fire({
        timer: 3000,
        html: html(contexto, mensaje),
        background: "#0f2818",
        color: "#4ade80",
        iconHtml: `<span style="font-size:22px">✅</span>`,
        customClass: { popup: "toast-pos" },
    });

export const toastError = (mensaje, contexto = "") =>
    base.fire({
        timer: 6000,
        html: html(contexto, mensaje),
        background: "#2a0f0f",
        color: "#f87171",
        iconHtml: `<span style="font-size:22px">❌</span>`,
        customClass: { popup: "toast-pos" },
    });

export const toastWarning = (mensaje, contexto = "") =>
    base.fire({
        timer: 4500,
        html: html(contexto, mensaje),
        background: "#2a2208",
        color: "#fbbf24",
        iconHtml: `<span style="font-size:22px">⚠️</span>`,
        customClass: { popup: "toast-pos" },
    });

export const confirmar = ({ titulo, texto, onConfirmar }) =>
    Swal.fire({
        title: titulo,
        text: texto,
        iconHtml: `<span style="font-size:36px">🗑️</span>`,
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#4b5563",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        background: "#1e1e2e",
        color: "#e2e8f0",
        customClass: { popup: "swal-pos" },
    }).then(async (r) => {
        if (r.isConfirmed) await onConfirmar();
    });
