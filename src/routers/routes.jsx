import { Navigate, Route, Routes } from "react-router-dom";
import { Categorias, Clientes, Configuraciones, Home, Login, POS, Productos, Proveedores, ProtectedRoute, UserAuth, useEmpresaStore, useUsuariosStore } from "../index"
import { useQuery } from "@tanstack/react-query";
import { Spinner1 } from "../components/moleculas/Spinner1";

export function Myroutes() {
  const { user } = UserAuth();
  const { datausuarios, mostrarusuarios } = useUsuariosStore();
  const { mostrarempresa, dataempresa } = useEmpresaStore();
  const { isLoading, error } = useQuery({
    queryKey: ["Mostrar Usuarios"],
    queryFn: mostrarusuarios, refetchOnWindowFocus: false
  });
  const { data: dtempresa } = useQuery({
    queryKey: ["Mostrar Empresa", datausuarios?.id],
    queryFn: () => mostrarempresa({ _id_usuario: datausuarios?.id }),
    enabled: !!datausuarios?.id, refetchOnWindowFocus: false
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
        <Route path="/pos" element={<POS />} />

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
