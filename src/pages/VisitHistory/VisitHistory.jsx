import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { api, useApiAuth } from "../../lib/api";
import "./VisitHistory.css";

const VisitHistory = () => {
  useApiAuth();
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, PENDING, ACCEPTED, REJECTED

  // Cargar historial de solicitudes
  useEffect(() => {
    loadVisitRequests();
    
    // Polling cada 10 segundos para actualizar estados
    const interval = setInterval(() => {
      loadVisitRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const loadVisitRequests = async () => {
    try {
      const response = await api.get("/my-properties");
      console.log("Solicitudes recibidas del backend:", response.data);
      
      // Normalizar estados a mayúsculas (backend usa mayúsculas)
      const normalizedRequests = (response.data || []).map(req => ({
        ...req,
        status: req.status?.toUpperCase() || req.status
      }));
      
      console.log("Solicitudes normalizadas:", normalizedRequests);
      setRequests(normalizedRequests);
    } catch (error) {
      console.error("Error loading visit requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: "En proceso", class: "badge-pending", icon: "" },
      OK: { text: "En proceso", class: "badge-pending", icon: "" },
      ACCEPTED: { text: "Aprobada", class: "badge-accepted", icon: "" },
      REJECTED: { text: "Rechazada", class: "badge-rejected", icon: "" },
      ERROR: { text: "Error", class: "badge-error", icon: "" }
    };
    return badges[status] || { text: status, class: "badge-default", icon: "" };
  };

  const getStatusMessage = (status) => {
    const messages = {
      PENDING: "Esperando validación...",
      OK: "Solicitud recibida, esperando aprobación...",
      ACCEPTED: "¡Visita aprobada! El monto fue descontado de tu wallet.",
      REJECTED: "Tu solicitud fue rechazada. No se realizó ningún cargo.",
      ERROR: "Hubo un error al procesar tu solicitud."
    };
    return messages[status] || "";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRequests = filter === "ALL" 
    ? requests 
    : filter === "PENDING"
      ? requests.filter(req => req.status === "PENDING" || req.status === "OK")
      : filter === "REJECTED"
        ? requests.filter(req => req.status === "REJECTED" || req.status === "ERROR")
        : requests.filter(req => req.status === filter);

  if (loading) {
    return (
      <main className="main">
        <div className="main-header">
          <h1>Historial de Solicitudes de Visita</h1>
          <div>Cargando...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="main-header">
        <h1>Historial de Solicitudes de Visita</h1>
        <p>Consulta el estado de tus solicitudes de visita a propiedades</p>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <button 
          className={`filter-btn ${filter === "ALL" ? "active" : ""}`}
          onClick={() => setFilter("ALL")}
        >
          Todas ({requests.length})
        </button>
        <button 
          className={`filter-btn ${filter === "PENDING" ? "active" : ""}`}
          onClick={() => setFilter("PENDING")}
        >
          En proceso ({requests.filter(r => r.status === "PENDING" || r.status === "OK").length})
        </button>
        <button 
          className={`filter-btn ${filter === "ACCEPTED" ? "active" : ""}`}
          onClick={() => setFilter("ACCEPTED")}
        >
          Aprobadas ({requests.filter(r => r.status === "ACCEPTED").length})
        </button>
        <button 
          className={`filter-btn ${filter === "REJECTED" ? "active" : ""}`}
          onClick={() => setFilter("REJECTED")}
        >
          Rechazadas ({requests.filter(r => r.status === "REJECTED" || r.status === "ERROR").length})
        </button>
      </div>

      {/* Lista de solicitudes */}
      <div className="requests-container">
        {filteredRequests.length === 0 ? (
          <div className="no-requests">
            <p>No hay solicitudes {filter !== "ALL" ? `con estado ${filter}` : ""}</p>
          </div>
        ) : (
          <div className="requests-list">
            {filteredRequests.map((request) => {
              const badge = getStatusBadge(request.status);
              return (
                <div key={request.request_id} className="request-item">
                  <div className="request-header">
                    <span className={`status-badge ${badge.class}`}>
                      {badge.icon} {badge.text}
                    </span>
                    <span className="request-date">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                  
                  <div className="request-body">
                    <div className="request-info">
                      <strong>ID de solicitud:</strong> {request.request_id}
                    </div>
                    <div className="request-message">
                      {getStatusMessage(request.status)}
                    </div>
                    <div className="request-actions">
                      <button 
                        onClick={() => navigate(`/purchases/${request.request_id}`)}
                        className="view-detail-btn"
                      >
                        Ver Detalle Completo →
                      </button>
                      {request.url && (
                        <a 
                          href={request.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="property-link"
                        >
                          Ver Propiedad Original →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default VisitHistory;