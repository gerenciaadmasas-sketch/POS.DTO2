import { Navigate, Route, Routes } from "react-router-dom";
import { SuspensionOverlay } from "../components/moleculas/SuspensionOverlay";
import { Categorias, Clientes, Configuraciones, Empresa, Home, Inventario, Kardex, Login, POS, Productos, Proveedores, Reportes, ProtectedRoute, UserAuth, useEmpresaStore, useUsuariosStore, Serializacion, TicketConfig, SucursalesCajas, Saas, PlanesConfig, Version } from "../index"
import { UsuariosConfig } from "../pages/UsuariosConfig";
import { MiPerfil } from "../pages/MiPerfil";
import { Arqueo } from "../pages/Arqueo";
import { Impresoras } from "../pages/Impresoras";
import { Landing } from "../pages/Landing";
import { Planes } from "../pages/Planes";
import { Finanzas } from "../pages/Finanzas";
import { Prospectos } from "../pages/Prospectos";
import { Soporte } from "../pages/Soporte";
import { Chat } from "../pages/Chat";
import { PagoExitoso } from "../pages/PagoExitoso";
import { Propiedades } from "../pages/Propiedades";
import { ProyectosObra } from "../pages/ProyectosObra";
import { Mensajes } from "../pages/Mensajes";
import { useQuery } from "@tanstack/react-query";
import { Spinner1 } from "../components/moleculas/Spinner1";
import { MostrarEmpresaPorId } from "../supabase/crudEmpresa";
import { useEffect } from "react";

export function Myroutes() {
  const { user } = UserAuth();
  const { datausuarios, mostrarusuarios } = useUsuariosStore();
  const { mostrarempresa, dataempresa, setEmpresa } = useEmpresaStore();


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
    <>
    <SuspensionOverlay />
    <Routes>
      {/* ── Rutas públicas (sin autenticación) ── */}
      <Route path="/"              element={user ? <Navigate to="/home" replace /> : <Planes />} />
      <Route path="/planes"        element={<Navigate to="/" replace />} />
      <Route path="/login"         element={user ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/pago-exitoso"  element={<PagoExitoso />} />
      <Route element={<ProtectedRoute user={user} redirectTo="/" />}>
        <Route path="/home" element={<Home />} />
        <Route path="/configuracion" element={<Configuraciones />} />
        <Route path="/configuracion/categorias" element={<Categorias />} />
        <Route path="/configuracion/productos" element={<Productos />} />
        <Route path="/configuracion/clientes" element={<Clientes />} />
        <Route path="/clientes" element={<Clientes />} />
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
        <Route path="/configuracion/impresoras" element={<Impresoras />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/saas" element={<Saas />} />
        <Route path="/configuracion/planes" element={<PlanesConfig />} />
        <Route path="/configuracion/version" element={<Version />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/prospectos" element={<Prospectos />} />
        <Route path="/mensajes"   element={<Mensajes />} />
        <Route path="/soporte"    element={<Soporte />} />
        <Route path="/chat"        element={<Chat />} />
        <Route path="/propiedades" element={<Propiedades />} />
        <Route path="/proyectos"   element={<ProyectosObra />} />

        <Route path="/configurar" element={<Navigate to="/configuracion" replace />} />
        <Route path="/configurar/categorias" element={<Navigate to="/configuracion/categorias" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/home" : "/"} replace />} />
    </Routes>
    </>
  );
}
