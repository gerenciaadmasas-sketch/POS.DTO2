import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = ({ user, redirectTo = "/login", children }) => {
  // 1. Si no hay usuario de sesión (Auth), directo al login
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // 2. Si hay usuario, permitimos el acceso a las rutas hijas
  // El Outlet se encargará de mostrar Home o Configuraciones
  return children ? children : <Outlet />;
};