import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
    *, *::before, *::after {
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    body {
        margin: 0;
        padding: 0;
        background-color: ${({ theme }) => theme.bgtotal};
        font-family: "Poppins", sans-serif;
        color: ${({ theme }) => theme.text};
        transition: background-color 0.2s ease, color 0.2s ease;
    }

    /* ── Scrollbar global ─────────────────────── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.color2};
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.colorScroll};
    }

    /* ── Toasts ───────────────────────────────── */
    .toast-pos {
        border-radius: 14px !important;
        box-shadow: 0 12px 40px rgba(0,0,0,0.35) !important;
        padding: 12px 16px !important;
        min-width: 280px !important;
        max-width: 380px !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
        font-family: "Poppins", sans-serif !important;
        backdrop-filter: blur(12px) !important;
    }
    .swal-pos {
        border-radius: 18px !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
        font-family: "Poppins", sans-serif !important;
    }
    .swal2-timer-progress-bar {
        opacity: 0.45 !important;
        background: #f88533 !important;
    }
    .toast-pos .swal2-icon {
        border: none !important;
        margin: 0 !important;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
    }
    .toast-pos .swal2-icon .swal2-icon-content {
        font-size: 22px !important;
        line-height: 1 !important;
    }

    /* ── Selects / Dropdowns ────────────────── */
    select {
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 32px !important;
    }

    select option {
        background: #162436;
        color: #D8E8F5;
        padding: 10px 14px;
    }

    select::-webkit-scrollbar { width: 4px; }
    select::-webkit-scrollbar-thumb {
        background: #f88533;
        border-radius: 10px;
    }

    /* Limitar alto del dropdown nativo */
    select { max-height: 42px; }
    select[size], select[multiple] {
        max-height: 200px;
        overflow-y: auto;
    }

    /* ── Impresión de ticket (80mm térmica) ──── */
    @media print {
        body * { visibility: hidden !important; }
        #ticket-print, #ticket-print * { visibility: visible !important; }
        #ticket-print {
            position: fixed;
            top: 0; left: 0;
            width: 80mm;
            padding: 4mm;
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
        }
        @page {
            size: 80mm auto;
            margin: 0;
        }
    }
`;
