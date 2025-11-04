
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../../lib/api';
import "./Navbar.css";
import logo from "../../assets/apartment.png";


// Navbar ahora usa Auth0 directamente
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  const [workerStatus, setWorkerStatus] = React.useState({
    loading: true,
    isOnline: false,
    workersActive: 0,
    timestamp: null,
  });

  React.useEffect(() => {
    let isActive = true;

    const fetchHeartbeat = async () => {
      try {
        const { data } = await api.get("/worker/heartbeat");
        if (!isActive) return;
        setWorkerStatus({
          loading: false,
          isOnline: Boolean(data?.status),
          workersActive: data?.workers_active ?? 0,
          timestamp: data?.timestamp ?? null,
        });
      } catch {
        if (!isActive) return;
        setWorkerStatus({
          loading: false,
          isOnline: false,
          workersActive: 0,
          timestamp: null,
        });
      }
    };

    fetchHeartbeat();
    const intervalId = window.setInterval(fetchHeartbeat, 15000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const statusClassName = React.useMemo(() => {
    if (workerStatus.loading) return "worker-status worker-status--loading";
    return workerStatus.isOnline ? "worker-status worker-status--ok" : "worker-status worker-status--error";
  }, [workerStatus.loading, workerStatus.isOnline]);

  const statusMessage = React.useMemo(() => {
    if (workerStatus.loading) return "Verificando JobMaster";
    if (workerStatus.isOnline) {
      if (workerStatus.workersActive > 0) {
        return `JobMaster activo (${workerStatus.workersActive} worker${workerStatus.workersActive === 1 ? "" : "s"})`;
      }
      return "JobMaster activo";
    }
    return "JobMaster inactivo";
  }, [workerStatus.isOnline, workerStatus.loading, workerStatus.workersActive]);

  const statusTitle = workerStatus.timestamp
    ? `Última actualización: ${new Date(workerStatus.timestamp).toLocaleString()}`
    : undefined;

  return (
    <nav className="navbar">
      <div className='navbar-left'>
        <div className='logo'>
          <img src={logo} alt="Logo" className="logo-img" />
        </div>
      </div>

      <div className='navbar-center'>
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
      </div>

      <div className='navbar-right'>
        <div className={statusClassName} title={statusTitle}>
          <span className="worker-status__dot" aria-hidden="true" />
          <span className="worker-status__text">{statusMessage}</span>
        </div>

        {isAuthenticated && (
          <>
            <span className="user-info">{user?.name || user?.email}</span>
            <button
              type='button'
              className="logout-link"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              Cerrar sesión
            </button>
          </>
        )}

        {!isAuthenticated && !isLoading && location.pathname === "/" && (
          <button type='button' className="login-link" onClick={() => loginWithRedirect()}>
            Iniciar sesión
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
