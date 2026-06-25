import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useUsuariosStore } from "../store/UsuariosStore";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useSucursalesStore } from "../store/SucursalesStore";
import { useAlmacenesConfigStore } from "../store/AlmacenesConfigStore";
import { ActualizarUsuario } from "../supabase/crudUsuarios";
import { supabase } from "../supabase/supabase.config";
import { toastExito, toastError } from "../utils/toast";
import { RiUserLine, RiShieldLine, RiBuildingLine, RiStoreLine, RiEditLine, RiSaveLine, RiCloseLine, RiLockLine } from "react-icons/ri";

const TIPO_COLORS = {
    superadmin:    { bg: "rgba(248,133,51,0.12)",  color: "#f88533" },
    cajero:        { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
    administrador: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
    supervisor:    { bg: "rgba(74,222,128,0.12)",  color: "#4ade80" },
};

const PERMISOS_LABELS = {
    ventas:           "Ventas",
    cobrar_venta:     "Cobrar venta",
    configuracion:    "Configuración",
    impresoras:       "Impresoras",
    empresa:          "Empresa",
    categorias:       "Categorías de productos",
    productos:        "Productos",
    clientes:         "Clientes",
    proveedores:      "Proveedores",
    sucursales_cajas: "Sucursales y cajas",
    usuarios:         "Usuarios",
    almacenes:        "Almacenes",
    inventario:       "Inventario",
    kardex:           "Kardex",
    dashboard:        "Dashboard",
    config_ticket:    "Config. ticket",
    serializacion:    "Serialización",
};

export function MiPerfil() {
    const { datausuarios, mostrarusuarios } = useUsuariosStore();
    const { dataempresa }    = useEmpresaStore();
    const { dataSucursales } = useSucursalesStore();
    const { dataAlmacenes }  = useAlmacenesConfigStore();

    const [editandoDatos, setEditandoDatos] = useState(false);
    const [editandoClave, setEditandoClave] = useState(false);

    const u  = datausuarios;
    const tc = TIPO_COLORS[u?.tipo] ?? TIPO_COLORS.cajero;
    const nombreCompleto = [u?.nombres, u?.apellidos].filter(Boolean).join(" ") || "Sin nombre";
    const inicial = (u?.nombres ?? "?")[0]?.toUpperCase();

    const esSuperAdmin = u?.tipo === "superadmin";
    const asignacion = esSuperAdmin
        ? "Administrador del sistema"
        : u?.tipo === "cajero"
        ? (dataAlmacenes?.find(a => a.id === u?.id_almacen)?.nombre ?? "Sin almacén")
        : u?.tipo === "supervisor"
        ? (dataSucursales?.find(s => s.id === u?.id_sucursal)?.razon_social ?? "Sin sucursal")
        : dataempresa?.razon_social ?? "Empresa";

    const permisosActivos = Object.entries(u?.permisos ?? {})
        .filter(([, v]) => v)
        .map(([k]) => PERMISOS_LABELS[k] ?? k);

    /* ── Formulario datos personales ── */
    const { register: regDatos, handleSubmit: hdDatos, formState: { errors: errDatos } } = useForm({
        defaultValues: { nombres: u?.nombres ?? "", apellidos: u?.apellidos ?? "", nro_doc: u?.nro_doc ?? "", telefono: u?.telefono ?? "" },
    });

    const mutDatos = useMutation({
        mutationFn: (vals) => ActualizarUsuario({ id: u.id, ...vals }),
        onSuccess: () => {
            toastExito("Datos actualizados", "Mi Perfil");
            mostrarusuarios();
            setEditandoDatos(false);
        },
    });

    /* ── Formulario contraseña ── */
    const { register: regClave, handleSubmit: hdClave, watch: wClave, reset: resetClave, formState: { errors: errClave } } = useForm();
    const nuevaClave = wClave("nueva");

    const mutClave = useMutation({
        mutationFn: async (vals) => {
            const { error } = await supabase.auth.updateUser({ password: vals.nueva });
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            toastExito("Contraseña actualizada", "Mi Perfil");
            resetClave();
            setEditandoClave(false);
        },
        onError: (e) => toastError(e.message, "Mi Perfil"),
    });

    return (
        <Page>
            <TopBar>
                <h1>Mi Perfil</h1>
                <p>información y configuración de tu cuenta</p>
            </TopBar>

            <Contenido>
                {/* ── Columna izquierda: avatar ── */}
                <ColIzq>
                    <Card>
                        <AvatarGrande $color={tc.color}>{inicial}</AvatarGrande>
                        <Nombre>{nombreCompleto}</Nombre>
                        <Usuario>@{u?.usuario ?? u?.email ?? "—"}</Usuario>
                        <TipoBadge $bg={tc.bg} $color={tc.color}>{u?.tipo ?? "cajero"}</TipoBadge>

                        <Separator />

                        {!esSuperAdmin && <InfoFila><RiBuildingLine /><span>{dataempresa?.razon_social ?? "—"}</span></InfoFila>}
                        <InfoFila><RiStoreLine /><span>{asignacion}</span></InfoFila>
                        {u?.telefono && <InfoFila><RiUserLine /><span>{u.telefono}</span></InfoFila>}
                        {u?.nro_doc  && <InfoFila><RiUserLine /><span>CC: {Number(u.nro_doc).toLocaleString("es-CO")}</span></InfoFila>}
                    </Card>
                </ColIzq>

                {/* ── Columna derecha: formularios ── */}
                <ColDer>
                    <Card $align="stretch">
                        <CardHeaderRow>
                            <CardTitle><RiEditLine /> Datos personales</CardTitle>
                            {!editandoDatos && (
                                <BtnAccion onClick={() => setEditandoDatos(true)}>Editar</BtnAccion>
                            )}
                        </CardHeaderRow>

                        {editandoDatos ? (
                            <FormDatos onSubmit={hdDatos(vals => mutDatos.mutate(vals))}>
                                <FilaDos>
                                    <Campo>
                                        <label>Nombre</label>
                                        <Input placeholder="Ej: Juan" {...regDatos("nombres", { required: true })} $error={!!errDatos.nombres} />
                                        {errDatos.nombres && <ErrMsg>Requerido</ErrMsg>}
                                    </Campo>
                                    <Campo>
                                        <label>Apellido</label>
                                        <Input placeholder="Ej: Pérez" {...regDatos("apellidos", { required: true })} $error={!!errDatos.apellidos} />
                                        {errDatos.apellidos && <ErrMsg>Requerido</ErrMsg>}
                                    </Campo>
                                </FilaDos>
                                <Campo>
                                    <label>Nro. documento</label>
                                    <Input placeholder="000000" {...regDatos("nro_doc")} />
                                </Campo>
                                <Campo>
                                    <label>Teléfono</label>
                                    <Input placeholder="300 000 0000" {...regDatos("telefono")} />
                                </Campo>
                                <FilaBtns>
                                    <BtnSecundario type="button" onClick={() => setEditandoDatos(false)}>
                                        <RiCloseLine /> Cancelar
                                    </BtnSecundario>
                                    <BtnGuardar type="submit" disabled={mutDatos.isPending}>
                                        <RiSaveLine /> {mutDatos.isPending ? "Guardando..." : "Guardar cambios"}
                                    </BtnGuardar>
                                </FilaBtns>
                            </FormDatos>
                        ) : (
                            <InfoGrid>
                                <InfoItem><span>Nombre</span><strong>{u?.nombres ?? "—"}</strong></InfoItem>
                                <InfoItem><span>Apellido</span><strong>{u?.apellidos ?? "—"}</strong></InfoItem>
                                <InfoItem><span>Documento</span><strong>{u?.nro_doc ?? "—"}</strong></InfoItem>
                                <InfoItem><span>Teléfono</span><strong>{u?.telefono ?? "—"}</strong></InfoItem>
                            </InfoGrid>
                        )}
                    </Card>

                    {/* Cambiar contraseña */}
                    <Card $align="stretch">
                        <CardHeaderRow>
                            <CardTitle><RiLockLine /> Contraseña</CardTitle>
                            {!editandoClave && (
                                <BtnAccion onClick={() => setEditandoClave(true)}>Cambiar</BtnAccion>
                            )}
                        </CardHeaderRow>

                        {editandoClave && (
                            <FormDatos onSubmit={hdClave(vals => mutClave.mutate(vals))}>
                                <Campo>
                                    <label>Nueva contraseña</label>
                                    <Input type="password" placeholder="••••••••"
                                        {...regClave("nueva", { required: true, minLength: 6 })}
                                        $error={!!errClave.nueva}
                                    />
                                    {errClave.nueva?.type === "minLength" && <ErrMsg>Mínimo 6 caracteres</ErrMsg>}
                                </Campo>
                                <Campo>
                                    <label>Confirmar contraseña</label>
                                    <Input type="password" placeholder="••••••••"
                                        {...regClave("confirmar", {
                                            required: true,
                                            validate: v => v === nuevaClave || "Las contraseñas no coinciden"
                                        })}
                                        $error={!!errClave.confirmar}
                                    />
                                    {errClave.confirmar && <ErrMsg>{errClave.confirmar.message}</ErrMsg>}
                                </Campo>
                                <FilaBtns>
                                    <BtnSecundario type="button" onClick={() => { setEditandoClave(false); resetClave(); }}>
                                        <RiCloseLine /> Cancelar
                                    </BtnSecundario>
                                    <BtnGuardar type="submit" disabled={mutClave.isPending}>
                                        <RiSaveLine /> {mutClave.isPending ? "Actualizando..." : "Actualizar contraseña"}
                                    </BtnGuardar>
                                </FilaBtns>
                            </FormDatos>
                        )}
                    </Card>

                    {/* Permisos (no superadmin) */}
                {!esSuperAdmin && (
                    <Card $wide>
                        <CardTitle><RiShieldLine /> Mis permisos</CardTitle>
                        {permisosActivos.length === 0 ? (
                            <MsgVacio>Sin permisos asignados</MsgVacio>
                        ) : (
                            <PermisosGrid>
                                {permisosActivos.map(p => (
                                    <PermisoPill key={p}>{p}</PermisoPill>
                                ))}
                            </PermisosGrid>
                        )}
                    </Card>
                )}
                </ColDer>
            </Contenido>
        </Page>
    );
}

/* ── Animations ── */
const fadeUp = keyframes`from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}`;

const Page = styled.div`
    min-height: 100vh; background: ${({ theme }) => theme.bgtotal};
    padding: 36px 32px; animation: ${fadeUp} 0.3s ease;
    display: flex; flex-direction: column; gap: 28px;

    @media (max-width: 767px) {
        padding: 68px 14px 24px;
        gap: 20px;
    }
`;

const TopBar = styled.div`
    h1 { font-size: 24px; font-weight: 900; color: ${({ theme }) => theme.text}; margin: 0 0 4px; }
    p  { font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin: 0; }
`;

const Contenido = styled.div`
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
    align-items: start;

    @media (max-width: 800px) {
        grid-template-columns: 1fr;
    }
`;

const ColIzq = styled.div`display: flex; flex-direction: column; gap: 20px;`;
const ColDer = styled.div`display: flex; flex-direction: column; gap: 20px;`;

const Card = styled.div`
    background: ${({ theme }) => theme.bgcards};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 20px; padding: 28px;
    display: flex; flex-direction: column;
    align-items: ${({ $wide, $align }) => $wide ? "flex-start" : $align === "stretch" ? "stretch" : "center"};
    gap: 14px;
    flex: ${({ $wide }) => $wide ? 1 : "none"};
    min-width: ${({ $wide }) => $wide ? "280px" : "auto"};
    transition: box-shadow 0.2s;
    &:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1); }
`;

const AvatarGrande = styled.div`
    width: 90px; height: 90px; border-radius: 50%;
    background: ${({ $color }) => $color
        ? `linear-gradient(135deg, ${$color}, ${$color}88)`
        : "linear-gradient(135deg, #6366f1, #2563eb)"};
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; font-weight: 900; color: #fff;
    margin-bottom: 6px;
    box-shadow: 0 8px 24px ${({ $color }) => $color ? `${$color}40` : "rgba(99,102,241,0.3)"};
`;

const Nombre  = styled.div`font-size: 20px; font-weight: 900; color: ${({ theme }) => theme.text};`;
const Usuario = styled.div`font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard}; margin-top: -4px;`;

const TipoBadge = styled.span`
    display: inline-block; padding: 5px 16px; border-radius: 20px;
    font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px;
    background: ${({ $bg }) => $bg}; color: ${({ $color }) => $color};
    border: 1px solid ${({ $color }) => $color}30;
`;

const Separator = styled.div`width: 100%; height: 1px; background: ${({ theme }) => theme.color2}; margin: 6px 0;`;

const InfoFila = styled.div`
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};
    svg { font-size: 16px; flex-shrink: 0; opacity: 0.6; }
    align-self: flex-start;
`;

const CardHeaderRow = styled.div`
    display: flex; align-items: center; justify-content: space-between; width: 100%;
`;

const CardTitle = styled.div`
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 800; color: ${({ theme }) => theme.text};
    text-transform: uppercase; letter-spacing: 0.5px;
`;

const BtnAccion = styled.button`
    display: flex; align-items: center; gap: 4px;
    background: none; border: 1px solid ${({ $cancel, theme }) => $cancel ? "#f87171" : theme.color2};
    border-radius: 8px; padding: 5px 10px; cursor: pointer;
    font-size: 12px; font-weight: 700; font-family: "Poppins", sans-serif;
    color: ${({ $cancel }) => $cancel ? "#f87171" : "#60a5fa"};
    transition: background 0.15s;
    &:hover { background: rgba(255,255,255,0.05); }
`;

const FormDatos = styled.form`display: flex; flex-direction: column; gap: 12px; width: 100%;`;

const Campo = styled.div`
    display: flex; flex-direction: column; gap: 5px;
    label { font-size: 11px; font-weight: 700; color: ${({ theme }) => theme.colorsubtitlecard}; text-transform: uppercase; letter-spacing: 0.5px; }
`;

const FilaDos = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 10px;`;

const FilaBtns = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 4px;
    justify-content: flex-end;
`;

const BtnSecundario = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 16px; border-radius: 10px; white-space: nowrap;
    border: 1.5px solid ${({ theme }) => theme.color2};
    background: transparent; color: ${({ theme }) => theme.colorsubtitlecard};
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif; transition: all 0.15s;
    &:hover { border-color: #f87171; color: #f87171; background: rgba(248,113,113,0.06); }
`;

const Input = styled.input`
    padding: 9px 12px; border-radius: 9px;
    border: 1.5px solid ${({ $error, theme }) => $error ? "#f87171" : theme.color2};
    background: ${({ theme }) => theme.bgtotal}; color: ${({ theme }) => theme.text};
    font-size: 13px; font-family: "Poppins", sans-serif; outline: none;
    &:focus { border-color: #2563eb; }
    &::placeholder { color: ${({ theme }) => theme.colorsubtitlecard}; }
`;

const ErrMsg = styled.span`font-size: 11px; color: #f87171;`;

const BtnGuardar = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 16px; border-radius: 10px; border: none; white-space: nowrap;
    background: #2563eb; color: #fff;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: "Poppins", sans-serif; transition: background 0.15s;
    &:hover:not(:disabled) { background: #1d4ed8; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const InfoGrid = styled.div`display: flex; flex-direction: column; gap: 8px; width: 100%;`;

const InfoItem = styled.div`
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px; padding: 6px 0;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    span { color: ${({ theme }) => theme.colorsubtitlecard}; }
    strong { color: ${({ theme }) => theme.text}; }
    &:last-child { border-bottom: none; }
`;

const MsgVacio = styled.div`font-size: 13px; color: ${({ theme }) => theme.colorsubtitlecard};`;

const PermisosGrid = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;

const PermisoPill = styled.span`
    padding: 5px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
    background: rgba(37,99,235,0.12); color: #60a5fa;
    border: 1px solid rgba(37,99,235,0.2);
`;
