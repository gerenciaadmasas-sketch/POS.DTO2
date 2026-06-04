import { useEffect, useState } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";
import { InputText, Btn1, useProductosStore, useCategoriasStore, ConvertirCapitalize, Switch1, ContainerSelector } from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMutation } from "@tanstack/react-query";

export function RegistrarProductos({ onClose, dataSelect, accion, setIsExploding }) {
    const { insertarProducto, editarProducto } = useProductosStore();
    const { datacategorias } = useCategoriasStore();
    const { dataempresa } = useEmpresaStore();
    const [stateInventarios, setStateInventarios] = useState(false);
    const [manejaMultiprecio, setManejaMultiprecio] = useState(false);

    const { register, formState: { errors }, handleSubmit, reset } = useForm();

    const { isPending, mutate: doGuardar } = useMutation({
        mutationFn: guardar,
        mutationKey: ["guardar producto"],
        onError: (err) => console.log("Error:", err.message),
        onSuccess: () => {
            onClose();
            setIsExploding(true);
        },
    });

    useEffect(() => {
        if (accion === "Editar" && dataSelect) {
            setStateInventarios(dataSelect.maneja_inventario ?? false);
            setManejaMultiprecio(dataSelect.maneja_multiprecio ?? false);
            reset({
                nombre: dataSelect.nombre,
                precio_venta: dataSelect.precio_venta,
                precio_compra: dataSelect.precio_compra,
                id_categoria: dataSelect.id_categoria,
                codigo_barra: dataSelect.codigo_barra,
                codigo_interno: dataSelect.codigo_interno,
                sevende_por: dataSelect.sevende_por,
                stock_minimo: dataSelect.stock_minimo,
            });
        }
    }, [accion, dataSelect]);

    async function guardar(data) {
        if (accion === "Editar") {
            const p = {
                _nombre: ConvertirCapitalize(data.nombre),
                _precio_venta: parseFloat(data.precio_venta),
                _precio_compra: parseFloat(data.precio_compra),
                _id_categoria: parseInt(data.id_categoria),
                _codigo_barra: data.codigo_barra || "-",
                _codigo_interno: data.codigo_interno || "-",
                _sevende_por: data.sevende_por,
                _stock_minimo: stateInventarios ? (parseFloat(data.stock_minimo) || 0) : 0,
                _maneja_inventario: stateInventarios,
                _maneja_multiprecio: manejaMultiprecio,
                _idempresa: dataempresa.id,
                _id: dataSelect.id,
            };
            await editarProducto(p);
        } else {
            const p = {
                _nombre: ConvertirCapitalize(data.nombre),
                _precio_venta: parseFloat(data.precio_venta),
                _precio_compra: parseFloat(data.precio_compra),
                _id_categoria: parseInt(data.id_categoria),
                _codigo_barra: data.codigo_barra || "-",
                _codigo_interno: data.codigo_interno || "-",
                _id_empresa: dataempresa.id,
                _sevende_por: data.sevende_por,
                _stock_minimo: stateInventarios ? (parseFloat(data.stock_minimo) || 0) : 0,
                _maneja_inventario: stateInventarios,
                _maneja_multiprecio: manejaMultiprecio,
            };
            await insertarProducto(p);
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
                            <h1>{accion === "Editar" ? "Editar producto" : "Registrar nueva productos"}</h1>
                        </section>
                        <section>
                            <span onClick={onClose}>x</span>
                        </section>
                    </div>

                    <form className="formulario" onSubmit={handleSubmit(doGuardar)}>
                        <div className="seccion1">
                            <InputText icono={<v.icononombre />}>
                                <input className="form__field" type="text" placeholder="nombre"
                                    {...register("nombre", { required: true })} />
                                <label className="form__label">nombre</label>
                                {errors.nombre && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconoprecioventa />}>
                                <input className="form__field" type="number" step="0.01" placeholder="precio venta"
                                    {...register("precio_venta", { required: true })} />
                                <label className="form__label">precio venta</label>
                                {errors.precio_venta && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconopreciocompra />}>
                                <input className="form__field" type="number" step="0.01" placeholder="precio compra"
                                    {...register("precio_compra", { required: true })} />
                                <label className="form__label">precio compra</label>
                                {errors.precio_compra && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconocodigobarras />}>
                                <input className="form__field" type="text" placeholder="codigo de barras"
                                    {...register("codigo_barra")} />
                                <label className="form__label">codigo de barras</label>
                            </InputText>

                            <InputText icono={<v.iconocodigointerno />}>
                                <input className="form__field" type="text" placeholder="codigo interno"
                                    {...register("codigo_interno")} />
                                <label className="form__label">codigo interno</label>
                            </InputText>
                        </div>

                        <div className="seccion2">
                            <ContainerSelector>
                                <label>Controlar stock: </label>
                                <Switch1
                                    state={stateInventarios}
                                    setState={() => setStateInventarios(!stateInventarios)}
                                />
                            </ContainerSelector>

                            {stateInventarios && (
                                <ContainerStock>
                                    <ContainerSelector>
                                        <label>Sucursal: </label>
                                    </ContainerSelector>

                                    <InputText icono={<v.iconostock />}>
                                        <input className="form__field" type="number" step="0.01" placeholder="stock"
                                            {...register("stock")} />
                                        <label className="form__label">stock</label>
                                    </InputText>

                                    <InputText icono={<v.iconostockminimo />}>
                                        <input className="form__field" type="number" step="0.01" placeholder="stock minimo"
                                            {...register("stock_minimo")} />
                                        <label className="form__label">stock minimo</label>
                                    </InputText>
                                </ContainerStock>
                            )}
                        </div>

                        <Btn1 icono={<v.iconoguardar />} titulo="Guardar" bgcolor="#F9D70B" />
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
    background-color: rgba(10, 9, 9, 0.5);
    display: flex;
    width: 100%;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .sub-contenedor {
        position: relative;
        width: 650px;
        max-width: 92%;
        max-height: 90vh;
        overflow-y: auto;
        border-radius: 20px;
        background: ${({ theme }) => theme.bgtotal};
        box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
        padding: 13px 36px 20px 36px;

        .headers {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            h1 { font-size: 20px; font-weight: 500; }
            span { font-size: 20px; cursor: pointer; }
        }

        .formulario {
            display: flex;
            flex-direction: column;
            gap: 20px;

            .seccion1 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                @media (max-width: 500px) { grid-template-columns: 1fr; }
            }

            .seccion2 {
                display: flex;
                flex-direction: column;
                gap: 14px;
                label {
                    font-size: 14px;
                    color: ${({ theme }) => theme.text};
                }
            }
        }
    }
`;

const ContainerStock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid rgba(150,150,150,0.3);
    background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.05)"};
`;
