import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * Componente para proteger rutas privadas.
 * Si el usuario no está autenticado, redirige a login.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthenticated) {
    loginWithRedirect();
    return null;
  }
  return children;
};

export default PrivateRoute;
