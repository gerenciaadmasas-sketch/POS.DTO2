import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { Icon } from "@iconify/react";
import { RiCloseLine } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useProveedoresStore } from "../../../store/ProveedoresStore";
import { useMutation } from "@tanstack/react-query";
import { ConvertirCapitalize } from "../../../index";

export function RegistrarProveedor({ onClose, dataSelect, accion }) {
    const { insertarProveedor, editarProveedor } = useProveedoresStore();
    const { dataempresa } = useEmpresaStore();
    const [tipoDoc, setTipoDoc] = useState("nit");

    const { register, formState: { errors }, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (accion === "Editar" && dataSelect) {
            setTipoDoc(dataSelect.tipo_documento ?? "nit");
            reset({
                nombre:    dataSelect.nombre    ?? "",
                nit:       dataSelect.nit       ?? "",
                telefono:  dataSelect.telefono  ?? "",
                email:     dataSelect.email     ?? "",
                contacto:  dataSelect.contacto  ?? "",
                direccion: dataSelect.direccion ?? "",
            });
        } else {
            setTipoDoc("nit");
        }
    }, [accion, dataSelect, reset]);

    const { isPending, mutate: doGuardar } = useMutation({
        mutationFn: guardar,
        onSuccess:  () => onClose(),
    });

    async function guardar(data) {
        const payload = {
            nombre:         ConvertirCapitalize(data.nombre),
            nit:            data.nit || null,
            tipo_documento: tipoDoc,
            telefono:       data.telefono  || null,
            email:          data.email     || null,
            contacto:       data.contacto  ? ConvertirCapitalize(data.contacto) : null,
            direccion:      data.direccion || null,
        };
        if (accion === "Editar") {
            await editarProveedor({ id: dataSelect.id, ...payload });
        } else {
            await insertarProveedor({ ...payload, id_empresa: dataempresa.id });
        }
    }

    return (
        <Overlay onClick={onClose}>
            <Box onClick={e => e.stopPropagation()}>
                <Head>
                    <HeadIcon>
                        <Icon icon="solar:shop-bold-duotone" />
                    </HeadIcon>
                    <HeadInfo>
                        <h2>{accion === "Editar" ? "Editar proveedor" : "Nuevo proveedor"}</h2>
                        <p>Completa los datos del proveedor</p>
                    </HeadInfo>
                    <CloseBtn onClick={onClose}><RiCloseLine /></CloseBtn>
                </Head>

                <Body onSubmit={handleSubmit(doGuardar)}>
                    {/* Tipo de documento */}
                    <FieldGroup>
                        <GroupLabel>Tipo de documento</GroupLabel>
                        <TipoToggle>
                            <TipoOpt $active={tipoDoc === "nit"} onClick={() => setTipoDoc("nit")} type="button">
                                <Icon icon="solar:buildings-bold-duotone" />
                                NIT
                                <TipoSub>Empresa / Persona jurídica</TipoSub>
                            </TipoOpt>
                            <TipoOpt $active={tipoDoc === "cedula"} onClick={() => setTipoDoc("cedula")} type="button">
                                <Icon icon="solar:card-bold-duotone" />
                                Cédula
                                <TipoSub>Persona natural</TipoSub>
                            </TipoOpt>
                        </TipoToggle>
                    </FieldGroup>

                    {/* Razón social / Nombre */}
                    <Row2>
                        <Field>
                            <label>Razón social / Nombre *</label>
                            <input placeholder={tipoDoc === "nit" ? "Nombre de la empresa" : "Nombre completo"}
                                {...register("nombre", { required: true })} />
                            {errors.nombre && <ErrMsg>Campo requerido</ErrMsg>}
                        </Field>
                        <Field>
                            <label>{tipoDoc === "nit" ? "NIT" : "Número de cédula"}</label>
                            <input placeholder={tipoDoc === "nit" ? "900123456-7" : "1234567890"}
                                {...register("nit")} />
                        </Field>
                    </Row2>

                    {/* Contacto y teléfono */}
                    <Row2>
                        <Field>
                            <label>Persona de contacto</label>
                            <input placeholder="Nombre del contacto" {...register("contacto")} />
                        </Field>
                        <Field>
                            <label>Teléfono</label>
                            <input placeholder="3001234567" {...register("telefono")} />
                        </Field>
                    </Row2>

                    {/* Email y dirección */}
                    <Row2>
                        <Field>
                            <label>Email</label>
                            <input type="email" placeholder="correo@empresa.com" {...register("email")} />
                        </Field>
                        <Field>
                            <label>Dirección</label>
                            <input placeholder="Dirección" {...register("direccion")} />
                        </Field>
                    </Row2>

                    <SaveBtn type="submit" disabled={isPending}>
                        {isPending ? (
                            <><Icon icon="solar:refresh-bold-duotone" style={{animation:"spin .7s linear infinite"}}/> Guardando…</>
                        ) : (
                            <><Icon icon="solar:check-circle-bold-duotone" /> {accion === "Editar" ? "Guardar cambios" : "Registrar proveedor"}</>
                        )}
                    </SaveBtn>
                </Body>
            </Box>
        </Overlay>
    );
}

const fadeIn  = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}`;

const Overlay  = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;animation:${fadeIn} .2s ease;`;
const Box      = styled.div`background:#0d1b2a;border:1px solid rgba(255,255,255,.1);border-radius:24px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;animation:${slideUp} .3s ease;&::-webkit-scrollbar{width:4px;}&::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px;}`;
const Head     = styled.div`display:flex;align-items:center;gap:14px;padding:22px 24px 18px;border-bottom:1px solid rgba(255,255,255,.07);`;
const HeadIcon = styled.div`width:44px;height:44px;border-radius:14px;background:rgba(248,133,51,.15);border:1px solid rgba(248,133,51,.3);display:flex;align-items:center;justify-content:center;font-size:22px;color:#f88533;flex-shrink:0;`;
const HeadInfo = styled.div`flex:1;h2{font-size:16px;font-weight:800;color:#fff;margin:0;}p{font-size:12px;color:rgba(255,255,255,.35);margin:0;}`;
const CloseBtn = styled.button`width:32px;height:32px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.15s;&:hover{background:rgba(248,113,113,.12);color:#f87171;}`;
const Body     = styled.form`padding:20px 24px;display:flex;flex-direction:column;gap:16px;`;

const FieldGroup  = styled.div`display:flex;flex-direction:column;gap:8px;`;
const GroupLabel  = styled.p`font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.3);margin:0;`;
const TipoToggle  = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;`;
const TipoOpt     = styled.button`display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 10px;border-radius:14px;border:1px solid ${p=>p.$active?"#f88533":"rgba(255,255,255,.08)"};background:${p=>p.$active?"rgba(248,133,51,.12)":"rgba(255,255,255,.03)"};color:${p=>p.$active?"#f88533":"rgba(255,255,255,.35)"};cursor:pointer;font-family:"Poppins",sans-serif;font-size:13px;font-weight:700;transition:.2s;svg{font-size:22px;}`;
const TipoSub     = styled.span`font-size:10px;font-weight:400;color:inherit;opacity:.7;`;

const Row2    = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:12px;@media(max-width:480px){grid-template-columns:1fr;}`;
const Field   = styled.div`display:flex;flex-direction:column;gap:5px;label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.35);}input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 13px;color:#fff;font-size:13px;font-family:"Poppins",sans-serif;outline:none;&:focus{border-color:#f88533;}&::placeholder{color:rgba(255,255,255,.2);}}`;
const ErrMsg  = styled.p`font-size:11px;color:#f87171;margin:0;`;
const SaveBtn = styled.button`display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#f88533,#f59e0b);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:"Poppins",sans-serif;margin-top:4px;transition:.15s;svg{font-size:18px;}&:hover{opacity:.9;}&:disabled{opacity:.5;cursor:not-allowed;}`;
