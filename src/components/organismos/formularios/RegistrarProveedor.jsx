import { useEffect } from "react";
import styled from "styled-components";
import { InputText, Btn1, ConvertirCapitalize } from "../../../index";
import { v } from "../../../styles/variables";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useProveedoresStore } from "../../../store/ProveedoresStore";
import { useMutation } from "@tanstack/react-query";

export function RegistrarProveedor({ onClose, dataSelect, accion }) {
    const { insertarProveedor, editarProveedor } = useProveedoresStore();
    const { dataempresa } = useEmpresaStore();

    const { register, formState: { errors }, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (accion === "Editar" && dataSelect) {
            reset({
                nombre: dataSelect.nombre,
                nit: dataSelect.nit ?? "",
                telefono: dataSelect.telefono ?? "",
                email: dataSelect.email ?? "",
                contacto: dataSelect.contacto ?? "",
                direccion: dataSelect.direccion ?? "",
            });
        }
    }, [accion, dataSelect, reset]);

    const { isPending, mutate: doGuardar } = useMutation({
        mutationFn: guardar,
        onSuccess: () => onClose(),
    });

    const handlesub = (data) => doGuardar(data);

    async function guardar(data) {
        if (accion === "Editar") {
            await editarProveedor({
                id: dataSelect.id,
                nombre: ConvertirCapitalize(data.nombre),
                nit: data.nit || null,
                telefono: data.telefono || null,
                email: data.email || null,
                contacto: data.contacto ? ConvertirCapitalize(data.contacto) : null,
                direccion: data.direccion || null,
            });
        } else {
            await insertarProveedor({
                nombre: ConvertirCapitalize(data.nombre),
                nit: data.nit || null,
                telefono: data.telefono || null,
                email: data.email || null,
                contacto: data.contacto ? ConvertirCapitalize(data.contacto) : null,
                direccion: data.direccion || null,
                id_empresa: dataempresa.id,
            });
        }
    }

    return (
        <Container>
            {isPending ? (
                <span>...🔼</span>
            ) : (
                <div className="sub-contenedor">
                    <div className="headers">
                        <section>
                            <h1>{accion === "Editar" ? "Editar proveedor" : "Registrar nuevo proveedor"}</h1>
                        </section>
                        <section>
                            <span onClick={onClose}>x</span>
                        </section>
                    </div>

                    <form className="formulario" onSubmit={handleSubmit(handlesub)}>
                        <section className="form-subcontainer">
                            <article>
                                <InputText icono={<v.iconoempresa />}>
                                    <input
                                        className="form__field"
                                        type="text"
                                        placeholder="Razón social"
                                        {...register("nombre", { required: true })}
                                    />
                                    <label className="form__label">Razón social</label>
                                    {errors.nombre?.type === "required" && <p>Campo requerido</p>}
                                </InputText>
                            </article>
                            <article>
                                <InputText icono={<v.iconocodigointerno />}>
                                    <input
                                        className="form__field"
                                        type="text"
                                        placeholder="NIT"
                                        {...register("nit")}
                                    />
                                    <label className="form__label">NIT (opcional)</label>
                                </InputText>
                            </article>
                            <article>
                                <InputText icono={<v.iconoflechaderecha />}>
                                    <input
                                        className="form__field"
                                        type="text"
                                        placeholder="Teléfono"
                                        {...register("telefono")}
                                    />
                                    <label className="form__label">Teléfono (opcional)</label>
                                </InputText>
                            </article>
                            <article>
                                <InputText icono={<v.iconoemail />}>
                                    <input
                                        className="form__field"
                                        type="email"
                                        placeholder="Email"
                                        {...register("email")}
                                    />
                                    <label className="form__label">Email (opcional)</label>
                                </InputText>
                            </article>
                            <article>
                                <InputText icono={<v.icononombre />}>
                                    <input
                                        className="form__field"
                                        type="text"
                                        placeholder="Nombre del contacto"
                                        {...register("contacto")}
                                    />
                                    <label className="form__label">Contacto (opcional)</label>
                                </InputText>
                            </article>
                            <article>
                                <InputText icono={<v.iconoflechaderecha />}>
                                    <input
                                        className="form__field"
                                        type="text"
                                        placeholder="Dirección"
                                        {...register("direccion")}
                                    />
                                    <label className="form__label">Dirección (opcional)</label>
                                </InputText>
                            </article>
                            <Btn1 icono={<v.iconoguardar />} titulo="Guardar" bgcolor="#F9D70B" />
                        </section>
                    </form>
                </div>
            )}
        </Container>
    );
}

const Container = styled.div`
    transition: 0.5s;
    top: 0; left: 0;
    position: fixed;
    background-color: rgba(10,9,9,0.5);
    display: flex;
    width: 100%;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .sub-contenedor {
        position: relative;
        width: 500px;
        max-width: 85%;
        border-radius: 20px;
        background: ${({ theme }) => theme.bgtotal};
        box-shadow: -10px 15px 30px rgba(10,9,9,0.4);
        padding: 13px 36px 20px 36px;
        z-index: 100;

        .headers {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            h1 { font-size: 20px; font-weight: 500; }
            span { font-size: 20px; cursor: pointer; }
        }
        .formulario .form-subcontainer {
            gap: 20px;
            display: flex;
            flex-direction: column;
        }
    }
`;
