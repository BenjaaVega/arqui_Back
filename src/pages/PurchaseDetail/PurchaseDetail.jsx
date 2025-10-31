import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { api, useApiAuth } from "../../lib/api";
import "./PurchaseDetail.css";

const PurchaseDetail = () => {
  useApiAuth();
  const { user } = useAuth0();
  const { purchaseId } = useParams();
  const navigate = useNavigate();
  
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  useEffect(() => {
    loadPurchaseDetail();
  }, [purchaseId]);

  const loadPurchaseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchases/${purchaseId}`);
      console.log("Purchase detail received:", response.data);
      setPurchase(response.data);
      setError("");
    } catch (err) {
      console.error("Error loading purchase detail:", err);
      setError("No se pudo cargar el detalle de la compra");
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      setDownloadingReceipt(true);
      const response = await api.get(`/purchases/${purchaseId}/receipt`, {
        responseType: 'blob'
      });
      
      // Crear URL temporal para descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleta-${purchaseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log("Boleta descargada exitosamente");
    } catch (err) {
      console.error("Error downloading receipt:", err);
      setError("No se pudo descargar la boleta");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: "En Proceso", class: "badge-pending", icon: "⏳" },
      ACCEPTED: { text: "Aprobada", class: "badge-accepted", icon: "✅" },
      REJECTED: { text: "Rechazada", class: "badge-rejected", icon: "❌" },
      ERROR: { text: "Error", class: "badge-error", icon: "⚠️" }
    };
    return badges[status] || { text: status, class: "badge-default", icon: "📋" };
  };

  const getStatusMessage = (status) => {
    const messages = {
      PENDING: "Tu compra está siendo procesada y validada.",
      ACCEPTED: "¡Compra exitosa! El monto fue procesado correctamente.",
      REJECTED: "Tu compra fue rechazada. No se realizó ningún cargo.",
      ERROR: "Hubo un error al procesar tu compra."
    };
    return messages[status] || "";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP"
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <main className="main">
        <div className="main-header">
          <h1>Detalle de Compra</h1>
          <div>Cargando...</div>
        </div>
      </main>
    );
  }

  if (error || !purchase) {
    return (
      <main className="main">
        <div className="main-header">
          <h1>Detalle de Compra</h1>
          <div className="error-message">
            {error || "No se pudo cargar el detalle de la compra"}
          </div>
          <button onClick={() => navigate("/visit-history")} className="back-button">
            Volver al Historial
          </button>
        </div>
      </main>
    );
  }

  const badge = getStatusBadge(purchase.status);
  const canDownloadReceipt = purchase.status === "ACCEPTED" && purchase.has_receipt;

  return (
    <main className="main">
      <div className="purchase-detail-header">
        <button onClick={() => navigate("/visit-history")} className="back-button">
          ← Volver al Historial
        </button>
        <h1>Detalle de Compra</h1>
        <div className="purchase-id">
          ID: {purchase.purchase_id || purchaseId}
        </div>
      </div>

      <div className="purchase-detail-container">
        {/* Estado de la compra */}
        <div className="detail-section status-section">
          <h2>Estado de la Compra</h2>
          <div className="status-content">
            <span className={`status-badge ${badge.class}`}>
              {badge.icon} {badge.text}
            </span>
            <p className="status-message">{getStatusMessage(purchase.status)}</p>
            {purchase.status === "ACCEPTED" && (
              <div className="success-indicator">
                🎉 Tu compra ha sido procesada exitosamente
              </div>
            )}
          </div>
        </div>

        {/* Detalle de la propiedad */}
        <div className="detail-section property-section">
          <h2>Propiedad</h2>
          {purchase.property && (
            <div className="property-detail">
              <div className="property-image">
                {purchase.property.image && (
                  <img 
                    src={purchase.property.image} 
                    alt={purchase.property.title || "Propiedad"}
                  />
                )}
              </div>
              <div className="property-info">
                <h3>{purchase.property.title || "Propiedad"}</h3>
                {purchase.property.location && (
                  <p className="property-location">
                    📍 {typeof purchase.property.location === 'object' 
                      ? (purchase.property.location.address || purchase.property.location.name || JSON.stringify(purchase.property.location))
                      : purchase.property.location}
                  </p>
                )}
                <div className="property-price">
                  <strong>Precio de arriendo:</strong> {formatCurrency(purchase.property.price)}
                </div>
                {purchase.property.bedrooms && (
                  <p>🛏️ {purchase.property.bedrooms} dormitorios</p>
                )}
                {purchase.property.bathrooms && (
                  <p>🚿 {purchase.property.bathrooms} baños</p>
                )}
                {purchase.property.m2 && (
                  <p>📐 {purchase.property.m2} m²</p>
                )}
                {purchase.property.url && (
                  <a 
                    href={purchase.property.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="property-link"
                  >
                    Ver ficha completa →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detalle de la transacción */}
        <div className="detail-section transaction-section">
          <h2>Detalle de la Transacción</h2>
          <div className="transaction-details">
            <div className="detail-row">
              <span className="detail-label">Monto pagado:</span>
              <span className="detail-value highlight">
                {formatCurrency(purchase.amount)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha de compra:</span>
              <span className="detail-value">
                {formatDate(purchase.created_at)}
              </span>
            </div>
            {purchase.transaction_date && (
              <div className="detail-row">
                <span className="detail-label">Fecha de transacción:</span>
                <span className="detail-value">
                  {formatDate(purchase.transaction_date)}
                </span>
              </div>
            )}
            {purchase.authorization_code && (
              <div className="detail-row">
                <span className="detail-label">Código de autorización:</span>
                <span className="detail-value code">
                  {purchase.authorization_code}
                </span>
              </div>
            )}
            {purchase.status === "REJECTED" && purchase.rejection_reason && (
              <div className="detail-row">
                <span className="detail-label">Razón de rechazo:</span>
                <span className="detail-value error-text">
                  {purchase.rejection_reason}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="detail-section actions-section">
          {canDownloadReceipt && (
            <button
              onClick={downloadReceipt}
              disabled={downloadingReceipt}
              className="download-receipt-btn"
            >
              {downloadingReceipt ? (
                "⏳ Descargando..."
              ) : (
                "📄 Descargar Boleta"
              )}
            </button>
          )}
          <button
            onClick={() => navigate("/visit-history")}
            className="secondary-button"
          >
            Ver Historial Completo
          </button>
        </div>
      </div>
    </main>
  );
};

export default PurchaseDetail;

