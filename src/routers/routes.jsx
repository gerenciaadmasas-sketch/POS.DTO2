import { Navigate, Route, Routes } from "react-router-dom";
import { Almacenes, Categorias, Clientes, Configuraciones, Empresa, Home, Inventario, Kardex, Login, POS, Productos, Proveedores, Reportes, ProtectedRoute, UserAuth, useEmpresaStore, useUsuariosStore, Serializacion, TicketConfig, SucursalesCajas, Saas, PlanesConfig, Version } from "../index"
import { UsuariosConfig } from "../pages/UsuariosConfig";
import { MiPerfil } from "../pages/MiPerfil";
import { Arqueo } from "../pages/Arqueo";
import { useQuery } from "@tanstack/react-query";
import { Spinner1 } from "../components/moleculas/Spinner1";
import { MostrarEmpresaPorId } from "../supabase/crudEmpresa";
import { useThemeStore } from "../store/ThemeStore";
import { useEffect } from "react";

export function Myroutes() {
  const { user } = UserAuth();
  const { datausuarios, mostrarusuarios } = useUsuariosStore();
  const { mostrarempresa, dataempresa, setEmpresa } = useEmpresaStore();
  const { applyRoleTheme } = useThemeStore();

  /* Forzar tema oscuro para admins en cuanto se carga el usuario */
  useEffect(() => {
    if (datausuarios?.tipo) applyRoleTheme(datausuarios.tipo);
  }, [datausuarios?.tipo]);

  const { isLoading, error } = useQuery({
    queryKey: ["Mostrar Usuarios"],
    queryFn: mostrarusuarios,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Carga empresa por id_auth del usuario (funciona para administrador/superadmin)
  useQuery({
    queryKey: ["Mostrar Empresa", datausuarios?.id],
    queryFn: () => mostrarempresa({ _id_usuario: datausuarios?.id }),
    enabled: !!datausuarios?.id, refetchOnWindowFocus: false
  });

  // Fallback para empleados: cargar empresa directamente por id_empresa del usuario
  useQuery({
    queryKey: ["Mostrar Empresa por id", datausuarios?.id_empresa],
    queryFn: async () => {
      const data = await MostrarEmpresaPorId(datausuarios.id_empresa);
      if (data) setEmpresa(data);
      return data;
    },
    enabled: !!datausuarios?.id_empresa && !dataempresa?.id,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (<Spinner1 />);
  }
  if (error) {
    return <span>error...</span>;
  }
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route element={<ProtectedRoute user={user} redirectTo="/login" />}>
        <Route path="/" element={<Home />} />
        <Route path="/configuracion" element={<Configuraciones />} />
        <Route path="/configuracion/categorias" element={<Categorias />} />
        <Route path="/configuracion/productos" element={<Productos />} />
        <Route path="/configuracion/clientes" element={<Clientes />} />
        <Route path="/configuracion/proveedores" element={<Proveedores />} />
        <Route path="/configuracion/empresa" element={<Empresa />} />
        <Route path="/configuracion/serializacion" element={<Serializacion />} />
        <Route path="/configuracion/sucursales" element={<SucursalesCajas />} />
        <Route path="/configuracion/ticket" element={<TicketConfig />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/kardex" element={<Kardex />} />
        <Route path="/configuracion/usuarios" element={<UsuariosConfig />} />
        <Route path="/perfil" element={<MiPerfil />} />
        <Route path="/arqueo" element={<Arqueo />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/saas" element={<Saas />} />
        <Route path="/configuracion/planes" element={<PlanesConfig />} />
        <Route path="/configuracion/version" element={<Version />} />

        <Route path="/configurar" element={<Navigate to="/configuracion" replace />} />
        <Route
          path="/configurar/categorias"
          element={<Navigate to="/configuracion/categorias" replace />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}
