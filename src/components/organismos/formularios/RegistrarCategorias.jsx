import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
// eslint-disable-next-line no-unused-vars
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  useCategoriasStore,
  Icono,
  ConvertirCapitalize,
} from "../../../index";
import { useForm } from "react-hook-form";
import { CirclePicker } from "react-color";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useAlmacenesConfigStore } from "../../../store/AlmacenesConfigStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MostrarAlmacenesPorEmpresa } from "../../../supabase/crudAlmacenesConfig";
import { RiStoreLine } from "react-icons/ri";

export function RegistrarCategorias({
  onClose,
  dataSelect,
  accion,
  setIsExploding,
}) {
  const { insertarCategorias, editarCategoria } = useCategoriasStore();
  const { dataempresa } = useEmpresaStore();
  const { dataAlmacenes } = useAlmacenesConfigStore();

  const [currentColor, setColor] = useState("#F44336");
  const [file,        setFile]        = useState([]);
  const [fileurl,     setFileurl]     = useState();
  const [iconoUrl,    setIconoUrl]    = useState(null); // URL existente seleccionada
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const ref = useRef(null);

  function elegirColor(color) { setColor(color.hex); }

  // Cargar almacenes con logos
  const { data: almacenesConLogo } = useQuery({
    queryKey: ["almacenes-logos", dataempresa?.id],
    queryFn: () => MostrarAlmacenesPorEmpresa({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    select: (data) => (data ?? []).filter(a => a.icono && a.icono !== "-"),
    refetchOnWindowFocus: false,
  });

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm();

  const { isPending, mutate: doInsertar } = useMutation({
    mutationFn: insertar,
    mutationKey: ["insertar categorias"],
    onError: (err) => console.log("El error", err.message),
    onSuccess: () => cerrarFormulario(),
  });

  const handlesub = (data) => { doInsertar(data); };

  const cerrarFormulario = () => {
    onClose();
    setIsExploding(true);
  };

  async function insertar(data) {
    if (accion === "Editar") {
      const p = {
        _nombre: ConvertirCapitalize(data.descripcion),
        _idempresa: dataempresa.id,
        _color: currentColor,
        _id: dataSelect.id,
      };
      await editarCategoria(p, dataSelect.icono, file, iconoUrl);
    } else {
      const p = {
        _nombre: ConvertirCapitalize(data.descripcion),
        _color: currentColor,
        _icono: iconoUrl || "-",
        _id_empresa: dataempresa.id,
      };
      await insertarCategorias(p, file, iconoUrl);
    }
  }

  function abrirImagenes() { ref.current.click(); }

  function prepararImagen(e) {
    let filelocal = e.target.files;
    let fileReaderlocal = new FileReader();
    fileReaderlocal.readAsDataURL(filelocal[0]);
    const tipoimg = e.target.files[0];
    setFile(tipoimg);
    setIconoUrl(null); // si sube archivo, descarta URL seleccionada
    if (fileReaderlocal && filelocal && filelocal.length) {
      fileReaderlocal.onload = function load() {
        setFileurl(fileReaderlocal.result);
      };
    }
  }

  function seleccionarLogoAlmacen(url) {
    setIconoUrl(url);
    setFileurl(url);
    setFile([]);       // descarta archivo si había uno
    setMostrarPicker(false);
  }

  useEffect(() => {
    if (accion === "Editar" && dataSelect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColor(dataSelect.color);
      setFileurl(dataSelect.icono);
    }
  }, [accion, dataSelect]);

  return (
    <Container>
      {isPending ? (
        <span>...🔼</span>
      ) : (
        <div className="sub-contenedor">
          <div className="headers">
            <section>
              <h1>
                {accion === "Editar" ? "Editar categoria" : "Registrar nueva categoria"}
              </h1>
            </section>
            <section>
              <span onClick={onClose}>x</span>
            </section>
          </div>

          <PictureContainer>
            {fileurl && fileurl !== "-" ? (
              <div className="ContentImage">
                <img src={fileurl} alt="icono" />
              </div>
            ) : (
              <Icono>{<v.iconoimagenvacia />}</Icono>
            )}

            <BotonesImagen>
              <Btn1
                funcion={abrirImagenes}
                titulo="+imagen"
                color="#5f5f5f"
                bgcolor="rgb(183,183,182)"
                icono={<v.iconosupabase />}
              />
              {(almacenesConLogo?.length ?? 0) > 0 && (
                <BtnPicker type="button" onClick={() => setMostrarPicker(v => !v)}>
                  <RiStoreLine />
                  logo almacén
                </BtnPicker>
              )}
            </BotonesImagen>

            <input type="file" ref={ref} onChange={(e) => prepararImagen(e)} />
          </PictureContainer>

          {mostrarPicker && (almacenesConLogo?.length ?? 0) > 0 && (
            <GaleriaLogos>
              <GaleriaTitulo>Selecciona el logo de un almacén</GaleriaTitulo>
              <GaleriaGrid>
                {almacenesConLogo.map(alm => (
                  <LogoOpcion
                    key={alm.id}
                    $activo={iconoUrl === alm.icono}
                    onClick={() => seleccionarLogoAlmacen(alm.icono)}
                    title={alm.nombre}
                  >
                    <img src={alm.icono} alt={alm.nombre} />
                    <span>{alm.nombre}</span>
                  </LogoOpcion>
                ))}
              </GaleriaGrid>
            </GaleriaLogos>
          )}

          <form className="formulario" onSubmit={handleSubmit(handlesub)}>
            <section className="form-subcontainer">
              <article>
                <InputText icono={<v.iconoflechaderecha />}>
                  <input
                    className="form__field"
                    defaultValue={dataSelect.nombre}
                    type="text"
                    placeholder="categoria"
                    {...register("descripcion", { required: true })}
                  />
                  <label className="form__label">categoria</label>
                  {errors.descripcion?.type === "required" && <p>Campo requerido</p>}
                </InputText>
              </article>

              <article className="colorContainer">
                <ContentTitle>
                  {<v.paletacolores />}
                  <span>Color</span>
                </ContentTitle>
                <div className="colorPickerContent">
                  <CirclePicker onChange={elegirColor} color={currentColor} />
                </div>
              </article>

              <Btn1 icono={<v.iconoguardar />} titulo="Guardar" bgcolor="#F9D70B" />
            </section>
          </form>
        </div>
      )}
    </Container>
  );
}

/* ── Styled ────────────────────────────────────── */

const slideDown = keyframes`from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}`;

const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
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
    max-height: 90vh;
    overflow-y: auto;

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
      .colorContainer .colorPickerContent { padding-top: 15px; min-height: 50px; }
    }
  }
`;

const PictureContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: start;
  border: 2px dashed #f9d70b;
  border-radius: 5px;
  background-color: rgba(249,215,11,0.1);
  padding: 8px;
  position: relative;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;

  .ContentImage {
    overflow: hidden;
    img { width: 48px; height: 48px; object-fit: contain; border-radius: 8px; }
  }
  input { display: none; }
`;

const BotonesImagen = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const BtnPicker = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 20px;
  cursor: pointer;
  background: rgba(99,102,241,0.12);
  border: 1.5px solid rgba(99,102,241,0.4);
  color: #818cf8;
  font-size: 12px;
  font-weight: 700;
  font-family: "Poppins", sans-serif;
  transition: all 0.15s;
  svg { font-size: 14px; }
  &:hover { background: rgba(99,102,241,0.22); border-color: #818cf8; }
`;

const GaleriaLogos = styled.div`
  background: ${({ theme }) => theme.bgcards};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  animation: ${slideDown} 0.18s ease;
`;

const GaleriaTitulo = styled.p`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colorsubtitlecard};
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GaleriaGrid = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const LogoOpcion = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid ${({ $activo }) => $activo ? "#f88533" : "rgba(255,255,255,0.1)"};
  background: ${({ $activo }) => $activo ? "rgba(248,133,51,0.12)" : "rgba(255,255,255,0.04)"};
  transition: all 0.15s;
  &:hover { border-color: #f88533; background: rgba(248,133,51,0.1); }

  img {
    width: 42px;
    height: 42px;
    object-fit: cover;
    border-radius: 50%;
  }
  span {
    font-size: 10px;
    font-weight: 700;
    font-family: "Poppins", sans-serif;
    color: ${({ $activo, theme }) => $activo ? "#f88533" : theme.colorsubtitlecard};
    max-width: 60px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ContentTitle = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 20px;
  svg { font-size: 25px; }
  input {
    border: none; outline: none; background: transparent;
    padding: 2px; width: 40px; font-size: 28px;
  }
`;
