import { useEffect, useState } from "react";
import styled from "styled-components";
// eslint-disable-next-line no-unused-vars
import { v } from "../../../styles/variables";
import {
  InputText,
  Btn1,
  useCategoriasStore,
  ConvertirCapitalize,
} from "../../../index";
import { useForm } from "react-hook-form";
import { CirclePicker } from "react-color";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMutation } from "@tanstack/react-query";

export function RegistrarCategorias({
  onClose,
  dataSelect,
  accion,
  setIsExploding,
}) {
  const { insertarCategorias, editarCategoria } = useCategoriasStore();
  const { dataempresa } = useEmpresaStore();
  const [currentColor, setColor] = useState("#F44336");

  function elegirColor(color) { setColor(color.hex); }

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
      await editarCategoria(p, dataSelect.icono, []);
    } else {
      const p = {
        _nombre: ConvertirCapitalize(data.descripcion),
        _color: currentColor,
        _icono: "-",
        _id_empresa: dataempresa.id,
      };
      await insertarCategorias(p, []);
    }
  }

  useEffect(() => {
    if (accion === "Editar" && dataSelect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColor(dataSelect.color);
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

const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
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
    width: 500px;
    max-width: 85%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
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

    .formulario {
      .form-subcontainer {
        gap: 20px;
        display: flex;
        flex-direction: column;
        .colorContainer .colorPickerContent { padding-top: 15px; min-height: 50px; }
      }
    }
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
