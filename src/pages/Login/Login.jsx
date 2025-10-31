import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./Login.css";

const Login = () => {
  const { loginWithRedirect, isLoading, error } = useAuth0();
  return (
    <main className="main">
      <div className="main-header">
        <h1>Iniciar sesión</h1>
        <button
          className="login-link"
          onClick={() => loginWithRedirect()}
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Iniciar sesión con Auth0"}
        </button>
        {error && <p style={{ color: 'red' }}>{error.message}</p>}
      </div>
    </main>
  );
};

export default Login;
