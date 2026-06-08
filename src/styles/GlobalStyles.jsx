import {createGlobalStyle} from "styled-components"
export const GlobalStyles = createGlobalStyle`
    body{
        margin:0;
        padding:0;
        box-sizing:border-box;
        background-color:${({theme})=>theme.bgtotal};
        font-family:"Poppins",sans-serif;
        color:#fff;
    }

    /* Toasts POS */
    .toast-pos {
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        padding: 12px 16px !important;
        min-width: 280px !important;
        max-width: 380px !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
    }
    .swal-pos {
        border-radius: 16px !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
    }
    .swal2-timer-progress-bar {
        opacity: 0.5 !important;
    }
    /* Ícono sin círculo */
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
`