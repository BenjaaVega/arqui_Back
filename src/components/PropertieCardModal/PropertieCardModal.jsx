import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, useApiAuth } from "../../lib/api";
import { webpayService } from "../../services/webpayService";
import "./PropertieCardModal.css";

const PropertieCardModal = ({
  isOpen,
  onClose,
  property,
  isOwnerView = false,
  onEdit,
  onDelete,
  onScheduleVisit,
}) => {
  useApiAuth();
  const { user, isAuthenticated } = useAuth0();
  const [requestingVisit, setRequestingVisit] = useState(false);
  const [visitMessage, setVisitMessage] = useState("");

  const handleRequestVisit = async () => {
    if (!property || !property.url) {
      setVisitMessage("Propiedad sin URL válida");
      return;
    }

    // Verificar autenticación
    if (!isAuthenticated) {
      setVisitMessage("Debes iniciar sesión para realizar una reserva");
      return;
    }
    
    setRequestingVisit(true);
    setVisitMessage("");

    try {
      // Calculate 10% of the property price
      const reservationAmount = Math.floor(property.price * 0.1);
      
      // Validate minimum amount (WebPay requires at least 10,000 CLP)
      const MINIMUM_AMOUNT = 10000;
      
      console.log('Creating reservation with:', {
        amount: reservationAmount,
        propertyPrice: property.price,
        url: property.url,
        property: property
      });
      
      if (reservationAmount < MINIMUM_AMOUNT) {
        throw new Error(`El monto de reserva (${reservationAmount.toLocaleString()} CLP) es menor al mínimo permitido (${MINIMUM_AMOUNT.toLocaleString()} CLP). El precio de la propiedad parece ser incorrecto.`);
      }
      
      // Save reservation context in sessionStorage before redirecting
      const reservationDescription = property.title
        ? `Reserva visita - ${property.title}`
        : 'Reserva de visita';

      sessionStorage.setItem('webpay_transaction_type', 'visit_reservation');
      sessionStorage.setItem('webpay_transaction_description', reservationDescription);
      sessionStorage.setItem('webpay_reservation_url', property.url);
      sessionStorage.setItem('webpay_reservation_price', property.price.toString());
      sessionStorage.setItem(
        'webpay_reservation_context',
        JSON.stringify({
          id: property.id ?? null,
          url: property.url,
          price: property.price ?? null,
          bedrooms: property.bedrooms ?? null,
          bathrooms: property.bathrooms ?? null,
          location: property.location ?? '',
          title: property.title ?? ''
        })
      );
      
      // Create WebPay transaction
      const response = await webpayService.createTransaction({
        amount: reservationAmount,
        url: property.url
      });
      
      console.log('WebPay response:', response);
      
      if (!response.token || !response.url) {
        console.error('Invalid WebPay response:', response);
        throw new Error('Invalid response from WebPay service');
      }

      // Build the complete WebPay URL with token
      // Check if token is already in the URL or needs to be added
      let completeUrl = response.url;
      if (!completeUrl.includes('token_ws=')) {
        const separator = completeUrl.includes('?') ? '&' : '?';
        completeUrl = `${completeUrl}${separator}token_ws=${response.token}`;
      }
      
      console.log('Complete WebPay URL:', completeUrl);
      
      // Redirect to WebPay
      window.location.href = completeUrl;
      
    } catch (error) {
      console.error("Error requesting visit with WebPay:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        setVisitMessage("Error de autenticación. Por favor, cierra sesión y vuelve a iniciar sesión.");
      } else if (error.response?.status === 403) {
        setVisitMessage("No tienes permisos para realizar esta operación.");
      } else if (error.response?.data?.detail) {
        setVisitMessage(error.response.data.detail);
      } else {
        setVisitMessage(error.message || "Error al iniciar el pago de reserva");
      }
      
      sessionStorage.removeItem('webpay_transaction_type');
      sessionStorage.removeItem('webpay_transaction_description');
      sessionStorage.removeItem('webpay_reservation_url');
      sessionStorage.removeItem('webpay_reservation_price');
      sessionStorage.removeItem('webpay_reservation_context');
      setRequestingVisit(false);
    }
  };

  if (!isOpen || !property) return null;

  const {
    title = "",
    image = "",
    price = 0,
    description = "",
    location = "",
    bedrooms,
    bathrooms,
    m2,
    visitsAvailable,   // opcional
    ownerId,
    ownerName,         // opcional si ya lo traes resuelto
    url,               // opcional: link a ficha externa
    isProject,         // opcional: proyecto nuevo, etc.
  } = property;

  // Determinar si el usuario actual es el dueño de la propiedad
  const isOwner = user?.sub && ownerId && user.sub === ownerId;
  const ownerLabel = ownerName || (ownerId ? `ID: ${ownerId}` : "Sin dueño");

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✖</button>

        <h2>{title}</h2>

        {image && (
          <img
            src={image}
            alt={title}
            style={{ width: "150px", height: "150px", objectFit: "cover" }}
          />
        )}

        {/* Meta principal */}
        <ul className="property-meta">
          {location && (
            <li>
              Ubicación: <span className="property-meta-line">{location}</span>
            </li>
          )}
          {typeof bedrooms !== "undefined" && (
            <li>
              Dormitorios: <span className="property-meta-line">{bedrooms}</span>
            </li>
          )}
          {typeof bathrooms !== "undefined" && (
            <li>
              Baños: <span className="property-meta-line">{bathrooms}</span>
            </li>
          )}
          {typeof m2 !== "undefined" && (
            <li>
              m²: <span className="property-meta-line">{m2}</span>
            </li>
          )}
          {typeof visitsAvailable !== "undefined" && (
            <li>
              Visitas disponibles:{" "}
              <span className="property-meta-line">{visitsAvailable}</span>
            </li>
          )}
          <li>
            Dueño: <span className="property-meta-line">{ownerLabel}</span>
          </li>
          {typeof isProject !== "undefined" && (
            <li>
              Proyecto:{" "}
              <span className="property-meta-line">
                {isProject ? "Sí" : "No"}
              </span>
            </li>
          )}
        </ul>

        <p>
          Precio de arriendo: <strong>${price?.toLocaleString()}</strong>
        </p>
        <p>
          Costo de agendamiento (10%): <strong>${(price * 0.1)?.toLocaleString()}</strong>
        </p>

        {description && <p className="property-desc">{description}</p>}

        {url && (
          <p>
            <a href={url} target="_blank" rel="noreferrer">
              Ver ficha completa
            </a>
          </p>
        )}

        {isOwnerView || isOwner ? (
          <div className="owner-actions">
            <button onClick={() => { onClose?.(); onEdit?.(property); }}>
              Editar
            </button>
            <button onClick={() => onDelete?.(property)}>
              Eliminar
            </button>
          </div>
        ) : (
          <div className="buyer-actions">
            {/* Sección de Agendamiento de Visita */}
            <div className="visit-section">
              <h3 className="visit-section-title">Agendar Visita</h3>
              
              {typeof visitsAvailable !== "undefined" && (
                <div className="visit-slots">
                  <strong>Cupos disponibles:</strong> {visitsAvailable}
                </div>
              )}

              <div className="visit-info-box">
                <p className="visit-process-title">Proceso de agendamiento:</p>
                <ol className="visit-process-steps">
                  <li>Realizarás un pago con WebPay del 10% del arriendo: <strong>${(price * 0.1)?.toLocaleString()}</strong></li>
                  <li>Este pago se reservará mientras se valida tu solicitud</li>
                  <li>Si es aprobada: se confirmará tu reserva</li>
                  <li>Si es rechazada: se te reembolsará el monto completo</li>
                </ol>
              </div>

              <button 
                onClick={handleRequestVisit}
                disabled={requestingVisit || visitsAvailable <= 0}
                className={`visit-btn ${visitsAvailable <= 0 ? 'no-slots' : 'request-btn'}`}
              >
                {requestingVisit ? "Iniciando pago..." : 
                 visitsAvailable <= 0 ? "Sin cupos disponibles" : 
                 `Reservar con WebPay (10% = $${(price * 0.1)?.toLocaleString()})`}
              </button>

              {visitMessage && (
                <div className={`visit-message ${visitMessage.includes('Cupo reservado') ? 'success' : 'error'}`}>
                  {visitMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertieCardModal;
