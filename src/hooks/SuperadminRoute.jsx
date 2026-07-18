import { Navigate, Outlet } from "react-router-dom";

export const SuperadminRoute = ({ usuario, redirectTo = "/home" }) => {
    if (usuario?.tipo !== "superadmin") {
        return <Navigate to={redirectTo} replace />;
    }
    return <Outlet />;
};
