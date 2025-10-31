
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import "./Navbar.css";
import logo from "../../assets/apartment.png";


// Navbar ahora usa Auth0 directamente
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  return (
    <nav className="navbar">
      <div className='logo'>
        <img src={logo} alt="Logo" className="logo-img" />       
      </div>

      <button type='button' className="font-navbar" onClick={() => navigate("/")}>  
        Inicio  
      </button>
      <button type='button' className="font-navbar" onClick={() => navigate("/properties")}>  
        Explorar Propiedades 
      </button>    

      {isAuthenticated && location.pathname !== "/login" && (
        <>
          <button type='button' className="font-navbar" onClick={() => navigate("/profile")}>  
            Mi Perfil 
          </button>
          <button type='button' className="font-navbar" onClick={() => navigate("/wallet")}>  
            Mi Wallet 
          </button>
          <button type='button' className="font-navbar" onClick={() => navigate("/visit-history")}>  
            Historial de Visitas 
          </button>
        </>
      )}

      {isAuthenticated && (
        <>
          <span className="user-info">{user?.name || user?.email}</span>
          <button type='button' className="logout-link" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>  
            Cerrar sesión  
          </button>
        </>
      )}

      {!isAuthenticated && !isLoading && location.pathname === "/" && (
        <button type='button' className="login-link" onClick={() => loginWithRedirect()}>  
          Iniciar sesión  
        </button>
      )}
    </nav>
  );
};

export default Navbar;
