import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase.config";
import { InsertarEmpresa } from "../supabase/crudEmpresa";
import { MostrarRolesXnombre } from "../supabase/crudRol";
import { MostrarTipoDocumento } from "../supabase/crudTipodocumentos";
import { InsertarAdmin, MostrarUsuarios } from "../supabase/crudUsuarios";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const perfilandoIds = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    const cargarSesionInicial = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        insertarDatos(session.user.id, session.user.email);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    cargarSesionInicial();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        if (session) {
          setUser(session.user);
          insertarDatos(session.user.id, session.user.email);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesion:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const insertarDatos = async (idAuth, correo) => {
    if (perfilandoIds.current.has(idAuth)) return;
    perfilandoIds.current.add(idAuth);

    const obtenerEmpresa = async () =>
      supabase
        .from("empresa")
        .select("id, id_usuario")
        .eq("id_auth", idAuth)
        .maybeSingle();

    try {
      const { data: empresaExistente } = await obtenerEmpresa();
      const usuarioExistente = await MostrarUsuarios({ correo });

      if (usuarioExistente?.id) {
        if (empresaExistente && !empresaExistente.id_usuario) {
          await supabase
            .from("empresa")
            .update({ id_usuario: usuarioExistente.id })
            .eq("id", empresaExistente.id);
        }
        return;
      }

      if (empresaExistente?.id_usuario) return;

      let idEmpresa = empresaExistente?.id;
      if (!idEmpresa) {
        const responseEmpresa = await InsertarEmpresa({
          razon_social: "Generica",
          id_fiscal: "-",
          direccion: "-",
          logo: "-",
          simbolomoneda: "$",
          id_auth: idAuth,
          id_usuario: null,
        });

        idEmpresa = responseEmpresa?.id;
        if (!idEmpresa) {
          const { data: empresaRecuperada } = await obtenerEmpresa();
          idEmpresa = empresaRecuperada?.id;
        }
      }

      if (!idEmpresa) return;

      const responseRol = await MostrarRolesXnombre({ nombre: "superadmin" });
      const responseTipoDoc = await MostrarTipoDocumento({ id_empresa: idEmpresa });
      if (!responseRol || !responseTipoDoc || responseTipoDoc.length === 0) return;

      const pUser = {
        nombres: "-",
        apellidos: "-",
        id_tipodocumento: responseTipoDoc[0].id,
        nro_doc: "-",
        celular: "-",
        correo,
        direccion: "-",
        id_rol: responseRol.id,
        fecha_de_ingreso: new Date().toISOString().split("T")[0],
        estado: "ACTIVO",
      };

      let responseUser = await InsertarAdmin(pUser);
      if (!responseUser?.id) {
        responseUser = await MostrarUsuarios({ correo });
      }

      if (responseUser?.id) {
        await supabase
          .from("empresa")
          .update({ id_usuario: responseUser.id })
          .eq("id", idEmpresa);
      }
    } catch (error) {
      console.error("Error critico en perfilado:", error.message);
    } finally {
      perfilandoIds.current.delete(idAuth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
