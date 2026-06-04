import { useEffect, useState } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";
import { InputText, Btn1, useProductosStore, useCategoriasStore, ConvertirCapitalize } from "../../../index";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMutation } from "@tanstack/react-query";

export function RegistrarProductos({ onClose, dataSelect, accion, setIsExploding }) {
    const { insertarProducto, editarProducto } = useProductosStore();
    const { datacategorias } = useCategoriasStore();
    const { dataempresa } = useEmpresaStore();
    const [manejaInventario, setManejaInventario] = useState(false);
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
            setManejaInventario(dataSelect.maneja_inventario ?? false);
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
                _stock_minimo: parseFloat(data.stock_minimo) || 0,
                _maneja_inventario: manejaInventario,
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
                _stock_minimo: parseFloat(data.stock_minimo) || 0,
                _maneja_inventario: manejaInventario,
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
                            <h1>{accion === "Editar" ? "Editar producto" : "Registrar nuevo producto"}</h1>
                        </section>
                        <section>
                            <span onClick={onClose}>x</span>
                        </section>
                    </div>

                    <form className="formulario" onSubmit={handleSubmit(doGuardar)}>
                        <div className="grid-form">
                            <InputText icono={<v.icononombre />}>
                                <input className="form__field" type="text" placeholder="Nombre"
                                    {...register("nombre", { required: true })} />
                                <label className="form__label">Nombre</label>
                                {errors.nombre && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconoprecioventa />}>
                                <input className="form__field" type="number" step="0.01" placeholder="Precio venta"
                                    {...register("precio_venta", { required: true })} />
                                <label className="form__label">Precio venta</label>
                                {errors.precio_venta && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconopreciocompra />}>
                                <input className="form__field" type="number" step="0.01" placeholder="Precio compra"
                                    {...register("precio_compra", { required: true })} />
                                <label className="form__label">Precio compra</label>
                                {errors.precio_compra && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconocategorias />}>
                                <select className="form__field" {...register("id_categoria", { required: true })}>
                                    <option value="">-- Categoría --</option>
                                    {datacategorias?.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                                <label className="form__label">Categoría</label>
                                {errors.id_categoria && <p>Campo requerido</p>}
                            </InputText>

                            <InputText icono={<v.iconocodigobarras />}>
                                <input className="form__field" type="text" placeholder="Código de barra"
                                    {...register("codigo_barra")} />
                                <label className="form__label">Código de barra</label>
                            </InputText>

                            <InputText icono={<v.iconocodigointerno />}>
                                <input className="form__field" type="text" placeholder="Código interno"
                                    {...register("codigo_interno")} />
                                <label className="form__label">Código interno</label>
                            </InputText>

                            <div className="select-container">
                                <label>Se vende por</label>
                                <select {...register("sevende_por", { required: true })}>
                                    <option value="Unidad">Unidad</option>
                                    <option value="Peso">Peso</option>
                                    <option value="Metro">Metro</option>
                                    <option value="Litro">Litro</option>
                                </select>
                                {errors.sevende_por && <p>Campo requerido</p>}
                            </div>

                            <InputText icono={<v.iconostockminimo />}>
                                <input className="form__field" type="number" step="0.01" placeholder="Stock mínimo"
                                    {...register("stock_minimo")} />
                                <label className="form__label">Stock mínimo</label>
                            </InputText>

                            <div className="toggle-container">
                                <label>
                                    <input type="checkbox" checked={manejaInventario}
                                        onChange={(e) => setManejaInventario(e.target.checked)} />
                                    Maneja inventario
                                </label>
                                <label>
                                    <input type="checkbox" checked={manejaMultiprecio}
                                        onChange={(e) => setManejaMultiprecio(e.target.checked)} />
                                    Maneja multiprecio
                                </label>
                            </div>
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
        width: 600px;
        max-width: 90%;
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

            .grid-form {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;

                @media (max-width: 500px) {
                    grid-template-columns: 1fr;
                }
            }

            .select-container {
                display: flex;
                flex-direction: column;
                gap: 6px;
                label { font-size: 13px; color: ${({ theme }) => theme.text}; }
                select {
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid rgba(150,150,150,0.4);
                    background: ${({ theme }) => theme.bgtotal};
                    color: ${({ theme }) => theme.text};
                    font-size: 14px;
                }
            }

            .toggle-container {
                grid-column: span 2;
                display: flex;
                gap: 24px;
                align-items: center;
                label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    cursor: pointer;
                    input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }
                }
                @media (max-width: 500px) { grid-column: span 1; flex-direction: column; }
            }
        }
    }
`;
