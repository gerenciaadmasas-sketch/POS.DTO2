import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useSucursalesStore } from "../../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../store/UsuariosStore";
import {
    ListarUsuariosEmpresa, CrearUsuarioEmpleado,
    ActualizarUsuario, EliminarUsuarioEmpleado,
} from "../../supabase/crudUsuarios";
import { RiDeleteBin2Line, RiEditLine, RiAddLine, RiCloseLine, RiUserLine, RiShieldLine } from "react-icons/ri";
import { toastExito } from "../../utils/toast";

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
const TIPOS_SUPERVISOR = ["cajero"];
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
    const esSupervisor = datausuarios?.tipo === "supervisor";
    const TIPOS = esSupervisor ? TIPOS_SUPERVISOR : TIPOS_TODOS;

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

    const usuarios = esSupervisor
        ? usuariosTodos.filter(u => !ROLES_OCULTOS_SUPERVISOR.includes(u.tipo))
        : usuariosTodos;

    const almacenesVisibles = esSupervisor
        ? (dataAlmacenes ?? []).filter(a => String(a.id_sucursal) === String(sucursalCreador))
        : (dataAlmacenes ?? []);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { usuario: "", password: "", nombres: "", apellidos: "", nro_doc: "", telefono: "", id_sucursal: "", id_almacen: "", tipo: "cajero" },
    });

    const tipoWatched = watch("tipo");

    function abrirNuevo() {
        const tipo = esSupervisor ? "cajero" : "cajero";
        reset({
            usuario: "", password: "", nombres: "", apellidos: "",
            nro_doc: "", telefono: "", id_almacen: "",
            id_sucursal: esSupervisor ? sucursalCreador : "",
            tipo,
        });
        setPermisos(permisosFromTipo(tipo));
        setEditando(null);
        setModalAbierto(true);
    }

    function abrirEditar(u) {
        reset({
            usuario:     u.usuario     ?? "",
            password:    "",
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

    function togglePermiso(key) {
        setPermisos(prev => ({ ...prev, [key]: !prev[key] }));
    }

    function aplicarTipo(tipo) {
        setValue("tipo", tipo);
        setPermisos(permisosFromTipo(tipo));
    }

    const getSucursalDeAlmacen = (id_almacen) =>
        dataAlmacenes?.find(a => String(a.id) === String(id_almacen))?.id_sucursal ?? null;

    const mutCrear = useMutation({
        mutationFn: (vals) => CrearUsuarioEmpleado({
            ...vals,
            id_empresa,
            permisos,
            email:       `${vals.usuario}@emp${id_empresa}.pos`,
            id_almacen:  vals.tipo === "cajero"      ? (vals.id_almacen  || null) : null,
            id_sucursal: vals.tipo === "supervisor"  ? (vals.id_sucursal || null)
                       : vals.tipo === "cajero"      ? getSucursalDeAlmacen(vals.id_almacen)
                       : sucursalCreador,
        }),
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

    return (
        <Page>
            {/* ── Encabezado ── */}
            <TopBar>
                <div>
                    <h1>Usuarios</h1>
                    <p>gestiona el equipo de trabajo</p>
                </div>
                <BtnNuevo onClick={abrirNuevo}>
                    <RiAddLine style={{ fontSize: 18 }} />
                    Nuevo usuario
                </BtnNuevo>
            </TopBar>

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
                        ? (dataSucursales?.find(s => s.id === u.id_sucursal)?.nombre ?? "Sin sucursal")
                        : "Toda la empresa";
                    const nombreCompleto = [u.nombres, u.apellidos].filter(Boolean).join(" ") || "Sin nombre";
                    const inicial = (u.nombres ?? "?")[0]?.toUpperCase();
                    const puedeEditar = !esSupervisor || u.tipo === "cajero";
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
                            {/* ── Columna izquierda: datos personales ── */}
                            <ColForm>
                                <ColTitle><RiUserLine /> Datos personales</ColTitle>

                                <Campo>
                                    <label>Usuario</label>
                                    <Input
                                        placeholder="ej: cajero1, jperez"
                                        disabled={!!editando}
                                        {...register("usuario", {
                                            required: !editando,
                                            pattern: { value: /^[a-zA-Z0-9_.-]+$/, message: "Sin espacios ni caracteres especiales" }
                                        })}
                                        $error={!!errors.usuario}
                                    />
                                    {errors.usuario?.message && <ErrMsg>{errors.usuario.message}</ErrMsg>}
                                </Campo>

                                {!editando && (
                                    <Campo>
                                        <label>Contraseña</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            {...register("password", { required: true, minLength: 6 })}
                                            $error={!!errors.password}
                                        />
                                        {errors.password?.type === "minLength" && <ErrMsg>Mínimo 6 caracteres</ErrMsg>}
                                    </Campo>
                                )}

                                <FilaDos>
                                    <Campo>
                                        <label>Nombre</label>
                                        <Input
                                            placeholder="Ej: Juan"
                                            {...register("nombres", { required: true })}
                                            $error={!!errors.nombres}
                                        />
                                    </Campo>
                                    <Campo>
                                        <label>Apellido</label>
                                        <Input
                                            placeholder="Ej: Pérez"
                                            {...register("apellidos", { required: true })}
                                            $error={!!errors.apellidos}
                                        />
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

                                {/* Cajero → almacén | Supervisor → sucursal | Admin → sin asignación */}
                                {tipoWatched === "cajero" && (
                                    <Campo>
                                        <label>Asignación de almacén</label>
                                        <Select {...register("id_almacen")}>
                                            <option value="">— Sin almacén —</option>
                                            {almacenesVisibles.map(a => {
                                                const suc = dataSucursales?.find(s => s.id === a.id_sucursal);
                                                return (
                                                    <option key={a.id} value={a.id}>
                                                        {esSupervisor ? a.nombre : `${suc ? `${suc.nombre} › ` : ""}${a.nombre}`}
                                                    </option>
                                                );
                                            })}
                                        </Select>
                                    </Campo>
                                )}

                                {tipoWatched === "supervisor" && (
                                    <Campo>
                                        <label>Asignación de sucursal</label>
                                        <Select {...register("id_sucursal")}>
                                            <option value="">— Sin sucursal —</option>
                                            {(dataSucursales ?? []).map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre}</option>
                                            ))}
                                        </Select>
                                    </Campo>
                                )}

                                {tipoWatched === "administrador" && (
                                    <AsignacionInfo>
                                        Acceso completo a toda la empresa — sin restricción de sucursal ni almacén.
                                    </AsignacionInfo>
                                )}

                                <BtnGuardar type="submit" disabled={pending}>
                                    {pending ? "Guardando..." : editando ? "Guardar cambios" : "Crear usuario"}
                                </BtnGuardar>
                            </ColForm>

                            {/* ── Columna derecha: permisos ── */}
                            <ColPermisos>
                                <ColTitle><RiShieldLine /> Permisos</ColTitle>

                                <Campo>
                                    <label>Tipo de usuario</label>
                                    <TiposRow>
                                        {TIPOS.map(t => {
                                            const tc = TIPO_COLORS[t];
                                            return (
                                                <TipoBtn key={t}
                                                    type="button"
                                                    $active={tipoWatched === t}
                                                    $color={tc.color}
                                                    onClick={() => aplicarTipo(t)}>
                                                    {t}
                                                </TipoBtn>
                                            );
                                        })}
                                    </TiposRow>
                                </Campo>

                                <PermisosScroll>
                                    {PERMISOS.map(p => (
                                        <PermisoFila key={p.key} onClick={() => togglePermiso(p.key)}>
                                            <Checkbox $checked={permisos[p.key]}>
                                                {permisos[p.key] && <span>✓</span>}
                                            </Checkbox>
                                            <span>{p.label}</span>
                                        </PermisoFila>
                                    ))}
                                </PermisosScroll>
                            </ColPermisos>
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

const BtnNuevo = styled.button`
    display: flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; border: none;
    background: #2563eb; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif;
    transition: background 0.15s;
    &:hover { background: #1d4ed8; }
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
    border-radius: 20px; width: 820px; max-width: 100%;
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
    display: grid; grid-template-columns: 1fr 1fr;
    overflow-y: auto; flex: 1;
    @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const ColForm = styled.div`
    padding: 24px; border-right: 1px solid ${({ theme }) => theme.color2};
    display: flex; flex-direction: column; gap: 14px;
`;

const ColPermisos = styled.div`
    padding: 24px; display: flex; flex-direction: column; gap: 14px;
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

const FilaDos = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 12px;`;

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

/* ── Permisos ── */
const TiposRow = styled.div`display: flex; gap: 6px; flex-wrap: wrap;`;

const TipoBtn = styled.button`
    flex: 1; min-width: 80px; padding: 8px; border-radius: 8px;
    font-size: 12px; font-weight: 700; cursor: pointer; text-transform: capitalize;
    font-family: "Poppins", sans-serif;
    border: 1.5px solid ${({ $active, $color, theme }) => $active ? $color : theme.color2};
    background: ${({ $active, $color }) => $active ? `${$color}18` : "transparent"};
    color: ${({ $active, $color, theme }) => $active ? $color : theme.text};
    transition: all 0.15s;
`;

const PermisosScroll = styled.div`
    flex: 1; overflow-y: auto;
    display: flex; flex-direction: column; gap: 2px;
    max-height: 380px;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colorScroll}; border-radius: 10px; }
`;

const PermisoFila = styled.div`
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 8px; cursor: pointer;
    font-size: 13px; color: ${({ theme }) => theme.text};
    transition: background 0.12s;
    &:hover { background: ${({ theme }) => theme.bgtotal}; }
`;

const Checkbox = styled.div`
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
    border: 2px solid ${({ $checked }) => $checked ? "#2563eb" : "#64748b"};
    background: ${({ $checked }) => $checked ? "#2563eb" : "transparent"};
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; color: #fff;
    transition: all 0.15s;
`;

const AsignacionInfo = styled.div`
    padding: 10px 14px; border-radius: 9px;
    background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.25);
    font-size: 12px; color: #a78bfa; line-height: 1.5;
`;
