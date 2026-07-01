import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";
import { SubirImagenProducto } from "../../../supabase/crudProductos";
import { RiImageAddLine } from "react-icons/ri";
import {
    InputText, Btn1, useProductosStore, useCategoriasStore, ConvertirCapitalize,
    ContainerSelector, useSucursalesStore, ListaDesplegable, Selector, Checkbox1,
    BuscarProductoPorCodigo, Switch1
} from "../../../index";
import { toastWarning } from "../../../utils/toast";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useAlmacenesConfigStore } from "../../../store/AlmacenesConfigStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useMutation } from "@tanstack/react-query";

export function RegistrarProductos({ onClose, dataSelect, accion, setIsExploding }) {
    const { insertarProducto, editarProducto, generarCodigo } = useProductosStore();
    const { datacategorias } = useCategoriasStore();
    const { dataempresa } = useEmpresaStore();
    const esAdmin = useUsuariosStore.getState().datausuarios?.tipo === "administrador";
    const { sucursalesItemSelect, selectSucursal } = useSucursalesStore();
    const { dataAlmacenes } = useAlmacenesConfigStore();

    const [imgFile,    setImgFile]    = useState(null);
    const [imgPreview, setImgPreview] = useState(null);
    const imgRef = useRef(null);

    const [aplicaIva, setAplicaIva] = useState(false);
    const [seVendePorUnidad, setSeVendePorUnidad] = useState(true);
    const [seVendePorGranel, setSeVendePorGranel] = useState(false);
    const [stateCategoriaLista, setStateCategoriaLista] = useState(false);
    const [categoriaSelect, setCategoriaSelect] = useState(null);
    const [stateSucursalesLista, setStateSucursalesLista] = useState(false);
    const [productoExistente, setProductoExistente] = useState(null);

    const { register, formState: { errors }, handleSubmit, reset, setValue } = useForm({ shouldUnregister: true });



    async function verificarCodigoBarra(codigo) {
        if (!codigo || codigo.length < 4) return setProductoExistente(null);
        const result = await BuscarProductoPorCodigo({ codigo_barra: codigo, id_empresa: dataempresa?.id });
        setProductoExistente(result ?? null);
        if (result) {
            setValue("nombre", result.nombre);
            setValue("precio_venta", result.precio_venta);
            setValue("precio_compra", result.precio_compra);
            setValue("stock_minimo", result.stock_minimo);
            setSeVendePorUnidad(result.sevende_por === "Unidad");
            setSeVendePorGranel(result.sevende_por === "Granel");
            const cat = datacategorias?.find(c => c.id === result.id_categoria);
            if (cat) setCategoriaSelect(cat);
        }
    }

    const { isPending, mutate: doGuardar } = useMutation({
        mutationFn: guardar,
        mutationKey: ["guardar producto"],
        onError: (err) => console.log("Error:", err.message),
        onSuccess: () => {
            onClose();
            setIsExploding(true);
        },
    });

    function pickImagen(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setImgFile(f);
        const r = new FileReader();
        r.onload = () => setImgPreview(r.result);
        r.readAsDataURL(f);
    }

    useEffect(() => {
        if (accion === "Editar" && dataSelect) {
            setImgPreview(dataSelect.imagen && dataSelect.imagen !== "-" ? dataSelect.imagen : null);
            setAplicaIva(dataSelect.aplica_iva ?? false);
            setSeVendePorUnidad(dataSelect.sevende_por === "Unidad");
            setSeVendePorGranel(dataSelect.sevende_por === "Granel");
            const cat = datacategorias?.find(c => c.id === dataSelect.id_categoria);
            if (cat) setCategoriaSelect(cat);
            reset({
                nombre: dataSelect.nombre,
                precio_venta: dataSelect.precio_venta,
                precio_compra: dataSelect.precio_compra,
                codigo_barra: dataSelect.codigo_barra,
                stock_minimo: dataSelect.stock_minimo,
            });
        }
    }, [accion, dataSelect]);

    function seleccionarUnidad() {
        setSeVendePorUnidad(true);
        setSeVendePorGranel(false);
    }

    function seleccionarGranel() {
        setSeVendePorGranel(true);
        setSeVendePorUnidad(false);
    }

    async function guardar(data) {
        const seVendePor = seVendePorUnidad ? "Unidad" : "Granel";
        const idCategoria = categoriaSelect?.id;

        if (!idCategoria) {
            toastWarning("Selecciona una categoría antes de guardar.", "Productos › Formulario");
            throw new Error("Selecciona una categoría");
        }

        if (accion === "Editar") {
            const p = {
                _nombre: ConvertirCapitalize(data.nombre),
                _precio_venta: parseFloat(data.precio_venta),
                _precio_compra: parseFloat(data.precio_compra),
                _id_categoria: idCategoria,
                _codigo_barra: data.codigo_barra || "-",
                _sevende_por: seVendePor,
                _stock_minimo: parseFloat(data.stock_minimo) || 0,
                _maneja_inventarios: true,
                _maneja_multiprecios: false,
                _aplica_iva: aplicaIva,
                _idempresa: dataempresa.id,
                _id: dataSelect.id,
            };
            await editarProducto(p);
            if (imgFile) await SubirImagenProducto({ id: dataSelect.id, id_empresa: dataempresa.id, file: imgFile });
        } else {
            const p = {
                _nombre: ConvertirCapitalize(data.nombre),
                _precio_venta: parseFloat(data.precio_venta),
                _precio_compra: parseFloat(data.precio_compra),
                _id_categoria: idCategoria,
                _codigo_barra: data.codigo_barra || "-",
                _id_empresa: dataempresa.id,
                _sevende_por: seVendePor,
                _stock_minimo: parseFloat(data.stock_minimo) || 0,
                _maneja_inventarios: true,
                _maneja_multiprecios: false,
                _aplica_iva: aplicaIva,
                _id_sucursal: sucursalesItemSelect?.id ?? null,
                _stock: parseFloat(data.stock) || 0,
            };
            const nuevo_id = await insertarProducto(p);
            if (imgFile && nuevo_id) await SubirImagenProducto({ id: nuevo_id, id_empresa: dataempresa.id, file: imgFile });
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

                    <ZonaImagen onClick={() => imgRef.current?.click()}>
                        {imgPreview
                            ? <FotoProducto src={imgPreview} alt="producto" />
                            : <PlaceholderFoto><RiImageAddLine /><span>foto del producto <em>(opcional)</em></span></PlaceholderFoto>}
                        {imgPreview && <BadgeCamara><RiImageAddLine /></BadgeCamara>}
                        <input type="file" accept="image/*" ref={imgRef} style={{ display: "none" }} onChange={pickImagen} />
                    </ZonaImagen>

                    <form className="formulario" onSubmit={handleSubmit(doGuardar)}>
                        <div className="dos-columnas">

                            {/* Columna izquierda */}
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

                                {esAdmin && (
                                    <InputText icono={<v.iconopreciocompra />}>
                                        <input className="form__field" type="number" step="0.01" placeholder="precio compra"
                                            {...register("precio_compra")} />
                                        <label className="form__label">precio compra</label>
                                    </InputText>
                                )}

                                <div className="fila-generar">
                                    <InputText icono={<v.iconocodigobarras />}>
                                        <input className="form__field" type="text" placeholder="codigo de barras"
                                            {...register("codigo_barra", {
                                                required: true,
                                                onChange: (e) => verificarCodigoBarra(e.target.value)
                                            })} />
                                        <label className="form__label">codigo de barras</label>
                                        {errors.codigo_barra && <p>Campo requerido</p>}
                                    </InputText>
                                    <BtnGenerar type="button" onClick={() => {
                                        const codigo = generarCodigo();
                                        setValue("codigo_barra", codigo);
                                        setProductoExistente(null);
                                    }}>Generar</BtnGenerar>
                                </div>
                                {productoExistente && (
                                    <Aviso>⚠️ Ya existe: <strong>{productoExistente.nombre}</strong></Aviso>
                                )}

                            </div>

                            {/* Columna derecha */}
                            <div className="seccion2">

                                {/* Se vende por */}
                                <div className="grupo">
                                    <label className="grupo-label">Se vende por:</label>
                                    <div className="checkboxes">
                                        <ContainerSelector>
                                            <Checkbox1 isChecked={seVendePorUnidad} onChange={seleccionarUnidad} />
                                            <span>UNIDAD</span>
                                        </ContainerSelector>
                                        <ContainerSelector>
                                            <Checkbox1 isChecked={seVendePorGranel} onChange={seleccionarGranel} />
                                            <span>GRANEL(decimales)</span>
                                        </ContainerSelector>
                                    </div>
                                </div>

                                {/* Categoría */}
                                <div className="grupo">
                                    <label className="grupo-label">Categoria:</label>
                                    <ContainerSelector style={{ position: "relative" }}>
                                        <Selector
                                            state={stateCategoriaLista}
                                            funcion={() => setStateCategoriaLista(!stateCategoriaLista)}
                                            texto1="🏷️"
                                            texto2={categoriaSelect?.nombre ?? "-- elegir --"}
                                            color="#675df1"
                                        />
                                        <ListaDesplegable
                                            funcion={setCategoriaSelect}
                                            state={stateCategoriaLista}
                                            data={datacategorias}
                                            top="3rem"
                                            scroll="auto"
                                            setState={() => setStateCategoriaLista(false)}
                                        />
                                    </ContainerSelector>
                                </div>

                                {/* Aplica IVA */}
                                <div className="grupo">
                                    <ContainerSelector>
                                        <label className="grupo-label">Aplica IVA (19%):</label>
                                        <Switch1
                                            state={aplicaIva}
                                            setState={() => setAplicaIva(!aplicaIva)}
                                        />
                                    </ContainerSelector>
                                </div>

                                {/* Stock — siempre visible */}
                                <ContainerStock>
                                    <div className="grupo">
                                        <label className="grupo-label">Almacén:</label>
                                        <ContainerSelector style={{ position: "relative" }}>
                                            <Selector
                                                state={stateSucursalesLista}
                                                funcion={() => setStateSucursalesLista(!stateSucursalesLista)}
                                                texto1="📦"
                                                texto2={sucursalesItemSelect?.nombre ?? "-- elegir --"}
                                                color="#fc6027"
                                            />
                                            <ListaDesplegable
                                                funcion={selectSucursal}
                                                state={stateSucursalesLista}
                                                data={dataAlmacenes}
                                                top="3rem"
                                                scroll="auto"
                                                setState={() => setStateSucursalesLista(false)}
                                            />
                                        </ContainerSelector>
                                    </div>

                                    <InputText icono={<v.iconostock />}>
                                        <input className="form__field" type="number" step="0.01" placeholder="stock inicial (0 si no tienes)"
                                            defaultValue={0}
                                            {...register("stock")} />
                                        <label className="form__label">stock inicial</label>
                                    </InputText>

                                    <InputText icono={<v.iconostockminimo />}>
                                        <input className="form__field" type="number" step="0.01" placeholder="stock minimo"
                                            defaultValue={0}
                                            {...register("stock_minimo")} />
                                        <label className="form__label">stock minimo</label>
                                    </InputText>
                                </ContainerStock>
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
        width: 700px;
        max-width: 94%;
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

            .dos-columnas {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                @media (max-width: 560px) { grid-template-columns: 1fr; }
            }

            .seccion1 {
                display: flex;
                flex-direction: column;
                gap: 16px;
                .fila-generar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    > div { flex: 1; }
                }
                .campo-eliminado {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    .fila-input {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        > div { flex: 1; }
                    }
                }
            }

            .seccion2 {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .grupo {
                display: flex;
                flex-direction: column;
                gap: 8px;
                .grupo-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: ${({ theme }) => theme.text};
                }
                .checkboxes {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                    span { font-size: 13px; }
                }
            }
        }
    }
`;

const BtnGenerar = styled.button`
    padding: 8px 14px;
    border-radius: 8px;
    border: 2px solid rgba(50,50,50,0.2);
    border-bottom: 4px solid rgba(50,50,50,0.2);
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: 0.2s;
    &:active {
        transform: translate(0, 2px);
        border-bottom: 2px solid rgba(50,50,50,0.2);
    }
    &:hover { background: ${({ theme }) => theme.bg3 || "rgba(150,150,150,0.1)"}; }
`;

const Aviso = styled.span`
    font-size: 12px;
    color: #fc6027;
    margin-top: 2px;
`;

const ContainerStock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid rgba(252, 96, 39, 0.4);
    background: rgba(252, 96, 39, 0.05);
`;

const ZonaImagen = styled.div`
    position: relative;
    width: 100%;
    height: 130px;
    border-radius: 14px;
    border: 2px dashed ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    transition: border-color 0.2s;
    &:hover { border-color: #f88533; }
`;

const FotoProducto = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const PlaceholderFoto = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colorsubtitlecard};
    svg { font-size: 32px; }
    span {
        font-size: 13px;
        font-weight: 600;
        font-family: "Poppins", sans-serif;
        em { font-style: normal; font-size: 11px; opacity: 0.6; }
    }
`;

const BadgeCamara = styled.div`
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(248,133,51,0.9);
    border-radius: 8px;
    padding: 5px 8px;
    display: flex;
    align-items: center;
    svg { font-size: 16px; color: #fff; }
`;
