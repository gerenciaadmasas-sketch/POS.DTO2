import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toastWarning } from "../utils/toast";

export const useCartVentasStore = create(
    persist(
        (set) => ({
            // ── Estado ─────────────────────────────────
            items:              [],
            metodoPago:         null,
            pagaCon:            "",
            mixto:              { efectivo: "", qr: "", transferencia: "" },
            statePantallaCobro: false,
            ticketData:         null,

            // ── Pantalla de cobro ───────────────────────
            setStatePantallaCobro: (p) =>
                set((state) => {
                    if (state.items.length === 0) {
                        toastWarning("Agrega productos al carrito primero.", "POS › Cobrar");
                        return state;
                    }
                    return { statePantallaCobro: !state.statePantallaCobro };
                }),

            cerrarPantallaCobro: () => set({ statePantallaCobro: false }),

            // ── Carrito ─────────────────────────────────
            agregarItem: (producto) =>
                set((state) => {
                    const esGranel = producto.sevende_por === "Granel";
                    const paso     = esGranel ? 0.5 : 1;
                    const existe   = state.items.find(i => i.id === producto.id);
                    if (existe) {
                        return {
                            items: state.items.map(i =>
                                i.id === producto.id
                                    ? { ...i, cantidad: parseFloat((i.cantidad + paso).toFixed(2)) }
                                    : i
                            ),
                        };
                    }
                    return {
                        items: [
                            ...state.items,
                            {
                                id:                 producto.id,
                                nombre:             producto.nombre,
                                precio:             producto.precio_venta,
                                aplica_iva:         producto.aplica_iva         ?? false,
                                maneja_inventarios: producto.maneja_inventarios ?? false,
                                esGranel,
                                cantidad:           paso,
                            },
                        ],
                    };
                }),

            cambiarCantidad: (id, delta) =>
                set((state) => ({
                    items: state.items.map(i => {
                        if (i.id !== id) return i;
                        const paso   = i.esGranel ? 0.5 : 1;
                        const minimo = i.esGranel ? 0.5 : 1;
                        const nueva  = parseFloat((i.cantidad + paso * delta).toFixed(2));
                        return { ...i, cantidad: Math.max(minimo, nueva) };
                    }),
                })),

            eliminarItem: (id) =>
                set((state) => ({ items: state.items.filter(i => i.id !== id) })),

            resetear: () =>
                set({
                    items:              [],
                    metodoPago:         null,
                    pagaCon:            "",
                    mixto:              { efectivo: "", qr: "", transferencia: "" },
                    statePantallaCobro: false,
                    ticketData:         null,
                }),

            // ── Pago ────────────────────────────────────
            setMetodoPago: (m) =>
                set({
                    metodoPago:         m,
                    pagaCon:            "",
                    mixto:              { efectivo: "", qr: "", transferencia: "" },
                    statePantallaCobro: true,
                }),

            setPagaCon:  (v)   => set({ pagaCon: v }),
            setMixto:    (obj) => set((state) => ({ mixto: { ...state.mixto, ...obj } })),

            // ── Ticket ──────────────────────────────────
            setTicketData:  (data) => set({ ticketData: data }),
            cerrarTicket:   ()     => set({ ticketData: null }),
        }),
        {
            name:    "cart-ventas-storage",
            partialize: (state) => ({
                items:      state.items,
                metodoPago: state.metodoPago,
                pagaCon:    state.pagaCon,
                mixto:      state.mixto,
            }),
        }
    )
);
