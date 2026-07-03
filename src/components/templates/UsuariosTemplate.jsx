import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { supabase } from "../../supabase/supabase.config";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import {
    ListarUsuariosEmpresa, CrearUsuarioEmpleado,
    ActualizarUsuario, EliminarUsuarioEmpleado,
} from "../../supabase/crudUsuarios";
import { RiDeleteBin2Line, RiEditLine, RiAddLine, RiCloseLine, RiUserLine, RiErrorWarningLine } from "react-icons/ri";
import { toastExito } from "../../utils/toast";
import { usePlan } from "../../hooks/usePlan";

/* ── Permisos disponibles ─────────────────────────────── */
const PERMISOS = [
    { key: "ventas",                  label: "Ventas" },
    { key: "cobrar_venta",            label: "Cobrar venta" },
    { key: "configuracion",           label: "Configuración" },
    { key: "impresoras",              label: "Impresoras" },
    { key: "empresa",                 label: "Empresa" },
    { key: "categorias",              label: "Categorías de productos" },
    { key: "productos",               label: "Productos" },
    { key: "clientes",                label: "Clientes" },
    { key: "proveedores",             label: "Proveedores" },
    { key: "sucursales_cajas",        label: "Sucursales y cajas" },
    { key: "usuarios",                label: "Usuarios" },
    { key: "almacenes",               label: "Almacenes" },
    { key: "inventario",              label: "Inventario" },
    { key: "kardex",                  label: "Kardex" },
    { key: "dashboard",               label: "Dashboard" },
    { key: "config_ticket",           label: "Configuración de ticket" },
    { key: "serializacion",           label: "Serialización de comprobantes" },
];

const TIPOS_TODOS = ["cajero", "supervisor", "administrador"];
const TIPOS_ADMIN = ["cajero", "supervisor"];
const TIPOS_SUPERVISOR = ["cajero"];
const ROLES_OCULTOS_ADMIN = ["superadmin", "administrador"];
const ROLES_OCULTOS_SUPERVISOR = ["administrador", "superadmin"];

const TIPO_COLORS = {
    cajero:        { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
    administrador: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
    supervisor:    { bg: "rgba(74,222,128,0.12)",  color: "#4ade80" },
};

/* ── Helpers ─────────────────────────────────────────── */
function permisosDefault() {
    return Object.fromEntries(PERMISOS.map(p => [p.key, false]));
}

function permisosFromTipo(tipo) {
    const base = permisosDefault();
    if (tipo === "cajero") return { ...base, ventas: true, cobrar_venta: true };
    if (tipo === "administrador") return Object.fromEntries(PERMISOS.map(p => [p.key, true]));
    return base;
}

/* ── Component ───────────────────────────────────────── */
export function UsuariosTemplate() {
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales, mostrarSucursales } = useSucursalesStore();
    const { dataAlmacenes, mostrarAlmacenes }   = useAlmacenesConfigStore();
    const { datausuarios }   = useUsuariosStore();
    const queryClient = useQueryClient();
    const id_empresa  = dataempresa?.id;
    const sucursalCreador = datausuarios?.id_sucursal ?? null;
    const tipoActual = datausuarios?.tipo;
    const esSupervisor = tipoActual === "supervisor";
    const esAdmin = tipoActual === "administrador";
    const TIPOS = esSupervisor ? TIPOS_SUPERVISOR : esAdmin ? TIPOS_ADMIN : TIPOS_TODOS;

    const { limites, tipoPlan } = usePlan();

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando,     setEditando]     = useState(null); // usuario a editar
    const [permisos,     setPermisos]     = useState(permisosDefault());

    useQuery({
        queryKey: ["sucursales-usr", id_empresa],
        queryFn:  () => mostrarSucursales({ id_empresa }),
        enabled:  !!id_empresa, refetchOnWindowFocus: false,
    });

    useQuery({
        queryKey: ["almacenes-usr", id_empresa],
        queryFn:  () => mostrarAlmacenes({ id_empresa }),
        enabled:  !!id_empresa, refetchOnWindowFocus: false,
    });

    const { data: usuariosTodos = [], isFetching } = useQuery({
        queryKey: ["usuarios-empresa", id_empresa],
        queryFn:  () => ListarUsuariosEmpresa({ id_empresa }),
        enabled:  !!id_empresa, refetchOnWindowFocus: false,
    });

    const rolesOcultos = esSupervisor ? ROLES_OCULTOS_SUPERVISOR
                       : esAdmin ? ROLES_OCULTOS_ADMIN
                       : [];
    const usuarios = rolesOcultos.length
        ? usuariosTodos.filter(u => !rolesOcultos.includes(u.tipo))
        : usuariosTodos;

    const almacenesVisibles = esSupervisor
        ? (dataAlmacenes ?? []).filter(a => String(a.id_sucursal) === String(sucursalCreador))
        : (dataAlmacenes ?? []);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { nombres: "", apellidos: "", nro_doc: "", telefono: "", id_sucursal: "", id_almacen: "", tipo: "cajero" },
    });

    const tipoWatched   = watch("tipo");
    const nombresVal    = watch("nombres");
    const apellidosVal  = watch("apellidos");
    const nroDocVal     = watch("nro_doc");

    const primerNombre  = (nombresVal ?? "").trim().split(" ")[0];
    const primerApellido = (apellidosVal ?? "").trim().split(" ")[0];
    const prevUsuario   = primerNombre && primerApellido
        ? primerNombre[0].toUpperCase() +
          primerApellido.charAt(0).toUpperCase() + primerApellido.slice(1).toLowerCase()
        : "";
    const prevPassword  = nroDocVal?.trim() || "123456";

    function abrirNuevo() {
        reset({
            nombres: "", apellidos: "", nro_doc: "", telefono: "", id_almacen: "",
            id_sucursal: esSupervisor ? sucursalCreador : "",
            tipo: "cajero",
        });
        setPermisos(permisosFromTipo("cajero"));
        setEditando(null);
        setModalAbierto(true);
    }

    function abrirEditar(u) {
        reset({
            nombres:     u.nombres     ?? "",
            apellidos:   u.apellidos   ?? "",
            nro_doc:     u.nro_doc     ?? "",
            telefono:    u.telefono    ?? "",
            id_sucursal: u.id_sucursal ?? "",
            id_almacen:  u.id_almacen  ?? "",
            tipo:        u.tipo        ?? "cajero",
        });
        setPermisos({ ...permisosDefault(), ...(u.permisos ?? {}) });
        setEditando(u);
        setModalAbierto(true);
    }

    function cerrarModal() { setModalAbierto(false); setEditando(null); }

    function aplicarTipo(tipo) {
        setValue("tipo", tipo);
        setPermisos(permisosFromTipo(tipo));
    }

    const getSucursalDeAlmacen = (id_almacen) =>
        dataAlmacenes?.find(a => String(a.id) === String(id_almacen))?.id_sucursal ?? null;

    const mutCrear = useMutation({
        mutationFn: async (vals) => {
            // Generar usuario: primera letra nombre + apellido (ej: JPérez)
            const nom = (vals.nombres?.trim().split(" ")[0] ?? "");
            const ape = (vals.apellidos?.trim().split(" ")[0] ?? "");
            const base = nom[0]?.toUpperCase() +
                (ape.charAt(0).toUpperCase() + ape.slice(1).toLowerCase());

            // Verificar unicidad dentro de la empresa
            let usuario = base;
            let intento = 1;
            while (true) {
                const { data: existe } = await supabase
                    .from("usuarios").select("id")
                    .eq("usuario", usuario)
                    .maybeSingle();
                if (!existe) break;
                intento++;
                usuario = `${base}${intento}`;
            }

            const password = vals.nro_doc?.trim() || "123456";

            return CrearUsuarioEmpleado({
                ...vals,
                usuario,
                password,
                id_empresa,
                permisos,
                email:       `${usuario}@emp${id_empresa}.pos`,
                id_almacen:  vals.tipo === "cajero"     ? (vals.id_almacen  || null) : null,
                id_sucursal: vals.tipo === "supervisor" ? (vals.id_sucursal || null)
                           : vals.tipo === "cajero"     ? getSucursalDeAlmacen(vals.id_almacen)
                           : sucursalCreador,
            });
        },
        onSuccess: () => {
            toastExito("Usuario creado", "Usuarios");
            queryClient.invalidateQueries({ queryKey: ["usuarios-empresa", id_empresa] });
            cerrarModal();
        },
    });

    const mutEditar = useMutation({
        mutationFn: (vals) => ActualizarUsuario({
            id:          editando.id,
            nombres:     vals.nombres,
            apellidos:   vals.apellidos,
            nro_doc:     vals.nro_doc,
            telefono:    vals.telefono,
            id_almacen:  vals.tipo === "cajero"      ? (vals.id_almacen  || null) : null,
            id_sucursal: vals.tipo === "supervisor"  ? (vals.id_sucursal || null)
                       : vals.tipo === "cajero"      ? getSucursalDeAlmacen(vals.id_almacen)
                       : sucursalCreador,
            tipo:        vals.tipo,
            permisos,
        }),
        onSuccess: () => {
            toastExito("Usuario actualizado", "Usuarios");
            queryClient.invalidateQueries({ queryKey: ["usuarios-empresa", id_empresa] });
            cerrarModal();
        },
    });

    const mutEliminar = useMutation({
        mutationFn: (u) => EliminarUsuarioEmpleado({ id: u.id }),
        onSuccess: () => {
            toastExito("Usuario eliminado", "Usuarios");
            queryClient.invalidateQueries({ queryKey: ["usuarios-empresa", id_empresa] });
        },
    });

    const onSubmit = (vals) => editando ? mutEditar.mutate(vals) : mutCrear.mutate(vals);
    const pending  = mutCrear.isPending || mutEditar.isPending;

    const limiteAlcanzado = limites.max_usuarios !== Infinity && usuarios.length >= limites.max_usuarios;

    return (
        <Page>
            {/* ── Encabezado ── */}
            <TopBar>
                <div>
                    <h1>Usuarios</h1>
                    <p>gestiona el equipo de trabajo</p>
                </div>
                <TopBarRight>
                    <PlanLimitBadge $alerta={limiteAlcanzado}>
                        {usuarios.length} / {limites.max_usuarios === Infinity ? "∞" : limites.max_usuarios} usuarios · {tipoPlan}
                    </PlanLimitBadge>
                    <BtnNuevo onClick={abrirNuevo} disabled={limiteAlcanzado} title={limiteAlcanzado ? `Límite del plan ${tipoPlan} alcanzado` : ""}>
                        <RiAddLine style={{ fontSize: 18 }} />
                        Nuevo usuario
                    </BtnNuevo>
                </TopBarRight>
            </TopBar>

            {limiteAlcanzado && (
                <LimitAlert>
                    <RiErrorWarningLine />
                    Tu plan <strong>{tipoPlan}</strong> permite hasta <strong>{limites.max_usuarios} usuarios</strong>. Actualiza tu plan para agregar más.
                </LimitAlert>
            )}

            {/* ── Lista de usuarios ── */}
            <Grid>
                {isFetching ? (
                    <MsgVacio>Cargando usuarios...</MsgVacio>
                ) : usuarios.length === 0 ? (
                    <MsgVacio>No hay usuarios registrados. Crea el primero.</MsgVacio>
                ) : usuarios.map(u => {
                    const tc = TIPO_COLORS[u.tipo] ?? TIPO_COLORS.cajero;
                    const asignacion = u.tipo === "cajero"
                        ? (dataAlmacenes?.find(a => a.id === u.id_almacen)?.nombre ?? "Sin almacén")
                        : u.tipo === "supervisor"
                        ? (dataSucursales?.find(s => s.id === u.id_sucursal)?.razon_social ?? "Sin sucursal")
                        : "Toda la empresa";
                    const nombreCompleto = [u.nombres, u.apellidos].filter(Boolean).join(" ") || "Sin nombre";
                    const inicial = (u.nombres ?? "?")[0]?.toUpperCase();
                    const puedeEditar = esSupervisor ? u.tipo === "cajero"
                                     : esAdmin ? (u.tipo === "cajero" || u.tipo === "supervisor")
                                     : true;
                    return (
                        <UserCard key={u.id}>
                            <UserAvatar>{inicial}</UserAvatar>
                            <UserInfo>
                                <UserNombre>{nombreCompleto}</UserNombre>
                                <UserEmail>@{u.usuario ?? u.email ?? "—"}</UserEmail>
                                <UserMeta>
                                    <TipoBadge $bg={tc.bg} $color={tc.color}>{u.tipo ?? "cajero"}</TipoBadge>
                                    <span>{asignacion}</span>
                                </UserMeta>
                            </UserInfo>
                            {puedeEditar && (
                                <UserAcciones>
                                    <BtnIco onClick={() => abrirEditar(u)}><RiEditLine /></BtnIco>
                                    <BtnIco $rojo onClick={() => mutEliminar.mutate(u)}><RiDeleteBin2Line /></BtnIco>
                                </UserAcciones>
                            )}
                        </UserCard>
                    );
                })}
            </Grid>

            {/* ── Modal ── */}
            {modalAbierto && (
                <Overlay onClick={cerrarModal}>
                    <ModalWrap onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <span>{editando ? "Editar usuario" : "Registrar usuario"}</span>
                            <BtnCerrarModal onClick={cerrarModal}><RiCloseLine /></BtnCerrarModal>
                        </ModalHeader>

                        <ModalBody onSubmit={handleSubmit(onSubmit)}>
                            <ColForm>
                                {/* Tipo de usuario */}
                                <Campo>
                                    <label>Tipo de usuario</label>
                                    <TiposRow>
                                        {TIPOS.map(t => {
                                            const tc = TIPO_COLORS[t];
                                            return (
                                                <TipoBtn key={t} type="button"
                                                    $active={tipoWatched === t}
                                                    $color={tc.color}
                                                    onClick={() => aplicarTipo(t)}>
                                                    {t === "cajero" ? "Cajero" : t === "supervisor" ? "Supervisor" : "Administrador"}
                                                </TipoBtn>
                                            );
                                        })}
                                    </TiposRow>
                                    <TipoDesc $color={TIPO_COLORS[tipoWatched]?.color}>
                                        {tipoWatched === "cajero"
                                            ? "Accede al POS e inventario de su almacén asignado."
                                            : tipoWatched === "supervisor"
                                            ? "Ve todos los almacenes de su sucursal y reportes."
                                            : "Gestión completa de la empresa."}
                                    </TipoDesc>
                                </Campo>

                                <Divider />

                                <ColTitle><RiUserLine /> Datos personales</ColTitle>

                                <FilaDos>
                                    <Campo>
                                        <label>Nombre</label>
                                        <Input placeholder="Ej: Juan" {...register("nombres", { required: true })} $error={!!errors.nombres} />
                                    </Campo>
                                    <Campo>
                                        <label>Apellido</label>
                                        <Input placeholder="Ej: Pérez" {...register("apellidos", { required: true })} $error={!!errors.apellidos} />
                                    </Campo>
                                </FilaDos>

                                <FilaDos>
                                    <Campo>
                                        <label>Nro. documento</label>
                                        <Input placeholder="0000000000" {...register("nro_doc")} />
                                    </Campo>
                                    <Campo>
                                        <label>Teléfono</label>
                                        <Input placeholder="300 000 0000" {...register("telefono")} />
                                    </Campo>
                                </FilaDos>

                                {tipoWatched === "cajero" && (
                                    <Campo>
                                        <label>Almacén asignado</label>
                                        <Select {...register("id_almacen")}>
                                            <option value="">— Sin almacén —</option>
                                            {almacenesVisibles.map(a => {
                                                const suc = dataSucursales?.find(s => s.id === a.id_sucursal);
                                                return (
                                                    <option key={a.id} value={a.id}>
                                                        {esSupervisor ? a.nombre : `${suc ? `${suc.razon_social} › ` : ""}${a.nombre}`}
                                                    </option>
                                                );
                                            })}
                                        </Select>
                                    </Campo>
                                )}

                                {tipoWatched === "supervisor" && (
                                    <Campo>
                                        <label>Sucursal asignada</label>
                                        <Select {...register("id_sucursal")}>
                                            <option value="">— Sin sucursal —</option>
                                            {(dataSucursales ?? []).map(s => (
                                                <option key={s.id} value={s.id}>{s.razon_social}</option>
                                            ))}
                                        </Select>
                                    </Campo>
                                )}

                                {tipoWatched === "administrador" && (
                                    <AsignacionInfo>
                                        Acceso completo a toda la empresa — sin restricción de sucursal ni almacén.
                                    </AsignacionInfo>
                                )}

                                {!editando && prevUsuario && (
                                    <CredPrev>
                                        <CredFila>
                                            <CredLbl>Usuario</CredLbl>
                                            <CredVal>{prevUsuario}</CredVal>
                                        </CredFila>
                                        <CredFila>
                                            <CredLbl>Contraseña</CredLbl>
                                            <CredVal>{prevPassword}</CredVal>
                                        </CredFila>
                                        <CredNota>Se asignan automáticamente al crear el usuario</CredNota>
                                    </CredPrev>
                                )}

                                <BtnGuardar type="submit" disabled={pending}>
                                    {pending ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
                                </BtnGuardar>
                            </ColForm>
                        </ModalBody>
                    </ModalWrap>
                </Overlay>
            )}
        </Page>
    );
}

/* ── Animations ── */
const fadeUp  = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;
const fadeIn  = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}`;

/* ── Page ── */
const Page = styled.div`
    min-height: 100vh;
    background: ${({ theme }) => theme.bgtotal};
    padding: 28px 28px;
    animation: ${fadeUp} 0.3s ease;

    @media (max-width: 767px) {
        padding: 68px 12px 20px;
    }
`;

const TopBar = styled.div`
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    h1 { font-size: 22px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const TopBarRight = styled.div`display: flex; align-items: center; gap: 10px; flex-wrap: wrap;`;

const PlanLimitBadge = styled.span`
    font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px;
    font-family: "Poppins", sans-serif;
    background: ${({ $alerta }) => $alerta ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.06)"};
    color: ${({ $alerta }) => $alerta ? "#f87171" : "#94a3b8"};
    border: 1px solid ${({ $alerta }) => $alerta ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.08)"};
`;

const LimitAlert = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px; margin-bottom: 20px;
    background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.25);
    color: #f87171; font-size: 13px; font-weight: 600;
    svg { font-size: 18px; flex-shrink: 0; }
`;

const BtnNuevo = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; border: none;
    background: ${({ disabled }) => disabled ? "rgba(37,99,235,0.35)" : "#2563eb"};
    color: ${({ disabled }) => disabled ? "rgba(255,255,255,0.4)" : "#fff"};
    font-size: 13px; font-weight: 700;
    cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};
    font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: #1d4ed8; }
`;

/* ── Grid de usuarios ── */
const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
`;

const MsgVacio = styled.div`
    grid-column: 1/-1; text-align: center; padding: 48px;
    font-size: 14px; color: ${({ theme }) => theme.colorsubtitlecard};
`;

const UserCard = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 14px; padding: 16px;
    display: flex; align-items: center; gap: 14px;
    transition: box-shadow 0.15s;
    &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
`;

const UserAvatar = styled.div`
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #2563eb);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: #fff; flex-shrink: 0;
`;

const UserInfo = styled.div`flex: 1; min-width: 0;`;
const UserNombre = styled.div`font-size: 14px; font-weight: 800; color: ${({ theme }) => theme.text};`;
const UserEmail  = styled.div`font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 2px 0 6px;`;
const UserMeta   = styled.div`display: flex; align-items: center; gap: 8px; font-size: 11px; color: ${({ theme }) => theme.colorsubtitlecard};`;

const TipoBadge = styled.span`
    display: inline-block; padding: 2px 8px; border-radius: 20px;
    font-size: 10px; font-weight: 800; text-transform: capitalize;
    background: ${({ $bg }) => $bg}; color: ${({ $color }) => $color};
`;

const UserAcciones = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const BtnIco = styled.button`
    background: none; border: none; cursor: pointer; font-size: 16px;
    color: ${({ $rojo, theme }) => $rojo ? "#f87171" : theme.colorsubtitlecard};
    padding: 4px; border-radius: 6px; display: flex; align-items: center;
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.08); }
`;

/* ── Modal ── */
const Overlay = styled.div`
    position: fixed; inset: 0; background: rgba(0,0,0,0.65);
    display: flex; align-items: center; justify-content: center;
    z-index: 999; padding: 20px; animation: ${fadeIn} 0.2s ease;
`;

const ModalWrap = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px; width: 500px; max-width: 100%;
    max-height: 90vh; overflow: hidden;
    box-shadow: 0 28px 70px rgba(0,0,0,0.4);
    animation: ${slideUp} 0.25s cubic-bezier(0.34,1.56,0.64,1);
    display: flex; flex-direction: column;
`;

const ModalHeader = styled.div`
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px; border-bottom: 1px solid ${({ theme }) => theme.color2};
    span { font-size: 16px; font-weight: 900; color: ${({ theme }) => theme.text}; }
    flex-shrink: 0;
`;

const BtnCerrarModal = styled.button`
    background: none; border: none; cursor: pointer; font-size: 22px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    display: flex; align-items: center;
    &:hover { color: #f87171; }
`;

const ModalBody = styled.form`
    display: flex; flex-direction: column;
    overflow-y: auto; flex: 1;
`;

const ColForm = styled.div`
    padding: 24px;
    display: flex; flex-direction: column; gap: 14px;
`;

const Divider = styled.div`
    width: 100%; height: 1px;
    background: ${({ theme }) => theme.color2};
    margin: 2px 0;
`;

const TipoDesc = styled.p`
    font-size: 12px; margin: 4px 0 0;
    color: ${({ $color }) => $color ?? "#94a3b8"};
    line-height: 1.4;
`;

const ColTitle = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; color: ${({ theme }) => theme.text};
    text-transform: uppercase; letter-spacing: 0.5px;
    margin-bottom: 4px;
`;

const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; letter-spacing: 0.5px; }
`;

const FilaDos = styled.div`
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const Input = styled.input`
    padding: 10px 12px; border-radius: 9px;
    border: 1.5px solid ${({ $error, theme }) => $error ? "#f87171" : theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #2563eb; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
    &:disabled { opacity: 0.5; }
`;

const Select = styled.select`
    padding: 10px 12px; border-radius: 9px;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #2563eb; }
`;

const ErrMsg = styled.span`font-size: 11px; color: #f87171;`;

const BtnGuardar = styled.button`
    margin-top: auto; padding: 12px; border-radius: 10px;
    border: none; background: #2563eb; color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif; transition: background 0.15s;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const TiposRow = styled.div`display: flex; gap: 8px; flex-wrap: wrap;`;

const TipoBtn = styled.button`
    flex: 1; min-width: 90px; padding: 10px 8px; border-radius: 10px;
    font-size: 13px; font-weight: 700; cursor: pointer; text-transform: capitalize;
    font-family: "Poppins", sans-serif;
    border: 1.5px solid ${({ $active, $color, theme }) => $active ? $color : theme.color2};
    background: ${({ $active, $color }) => $active ? `${$color}18` : "transparent"};
    color: ${({ $active, $color, theme }) => $active ? $color : theme.colorsubtitlecard};
    transition: all 0.15s;
    &:hover { border-color: ${({ $color }) => $color}; color: ${({ $color }) => $color}; }
`;

const CredPrev = styled.div`
    border: 1px solid rgba(248,133,51,0.25);
    background: rgba(248,133,51,0.06);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 6px;
`;

const CredFila = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px;
`;

const CredLbl = styled.span`
    color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;
`;

const CredVal = styled.span`
    color: #f88533; font-weight: 800; font-size: 14px;
    font-family: "Courier New", monospace;
`;

const CredNota = styled.span`
    font-size: 10px; color: ${({ theme }) => theme.colorsubtitlecard};
    margin-top: 2px; text-align: center;
`;

const AsignacionInfo = styled.div`
    padding: 10px 14px; border-radius: 9px;
    background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.25);
    font-size: 12px; color: #a78bfa; line-height: 1.5;
`;
