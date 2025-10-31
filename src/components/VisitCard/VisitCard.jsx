import React from "react";
import "./VisitCard.css";

const VisitCard = ({ visit, onView }) => {
  if (!visit) return null;

  const { request_id, url, status, created_at } = visit;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK':
        return 'status-pending';
      case 'PENDING':
        return 'status-pending';
      case 'ACCEPTED':
        return 'status-ok';
      case 'REJECTED':
        return 'status-rejected';
      case 'ERROR':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OK':
        return 'En proceso';
      case 'PENDING':
        return 'En proceso';
      case 'ACCEPTED':
        return 'Aprobada';
      case 'REJECTED':
        return 'Rechazada';
      case 'ERROR':
        return 'Error';
      default:
        return status;
    }
  };

  return (
    <article className="visit-card">
      <div className="visit-header">
        <h3 className="visit-title">Solicitud de Visita</h3>
        <span className={`visit-status ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      </div>

      <div className="visit-body">
        <p className="visit-id">
          <strong>ID:</strong> {request_id}
        </p>
        
        <p className="visit-date">
          <strong>Fecha:</strong> {formatDate(created_at)}
        </p>

        {url && (
          <p className="visit-url">
            <strong>URL:</strong> 
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="visit-link"
            >
              Ver propiedad
            </a>
          </p>
        )}

        <div className="visit-actions">
          <button
            className="visit-btn"
            onClick={() => onView?.(visit)}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
};

export default VisitCard;