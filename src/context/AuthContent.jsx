import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase.config";
import { InsertarEmpresa } from "../supabase/crudEmpresa";
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

  const insertarDatos = async (idAuth, email) => {
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
      const usuarioExistente = await MostrarUsuarios({ id_auth: idAuth });

      if (usuarioExistente?.id) {
        if (empresaExistente && !empresaExistente.id_usuario) {
          await supabase
            .from("empresa")
            .update({ id_usuario: usuarioExistente.id })
            .eq("id", empresaExistente.id);
        }
        return;
      }

      // Fallback: buscar por email (empleados creados con Edge Function
      // pueden tener id_auth no sincronizado en la tabla)
      const { data: usuarioPorEmail } = await supabase
        .from("usuarios")
        .select("id, id_auth")
        .eq("email", email)
        .maybeSingle();

      if (usuarioPorEmail?.id) {
        // Sincronizar id_auth si cambió
        if (usuarioPorEmail.id_auth !== idAuth) {
          await supabase
            .from("usuarios")
            .update({ id_auth: idAuth })
            .eq("id", usuarioPorEmail.id);
        }
        return;
      }

      // Solo llegar aquí si es realmente un usuario nuevo (admin que se registra)
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

      const pUser = {
        id_auth:    idAuth,
        email,
        nombres:    "-",
        apellidos:  "-",
        nro_doc:    "-",
        telefono:   "-",
        tipo:       "administrador",
        id_empresa: idEmpresa,
        permisos:   {},
      };

      let responseUser = await InsertarAdmin(pUser);
      if (!responseUser?.id) {
        responseUser = await MostrarUsuarios({ id_auth: idAuth });
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
