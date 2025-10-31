import React from "react";
import "./PropertieCard.css";

const PropertieCard = ({
  property,
  isOwner = false,
  onEdit,
  onDelete,
  onView,
  onBuy,
}) => {
  if (!property) return null;

  const { title, image, price, description, location } = property;

  return (
    <article className="property-card">

      <div className="property-thumb">
        {image && <img src={image} alt={title} />}

      </div>

      {/* Contenido */}
      <div className="property-body">
        <h3 className="property-title">{title}</h3>

        {location && (
          <p className="property-location">Ubicación: {location}</p>
        )}

        {price != null && (
          <p className="property-price">Precio: ${price}</p>
        )}

        {description && (
          <p className="property-desc">{description}</p>
        )}

        {/* Acciones */}
        <div className="property-actions">
          <button
            className="property-btn"
            onClick={() => onView?.(property)}
          >
            Ver detalles
          </button>

          {isOwner && (
            <>
              <button
                className="property-btn"
                onClick={() => onEdit?.(property)}
              >
                Editar
              </button>
              <button
                className="property-btn property-btn--danger"
                onClick={() => onDelete?.(property)}
              >
                Eliminar
              </button>
            </>
          )}

          {!isOwner && onBuy && (
            <button
              className="property-btn property-btn--primary"
              onClick={() => onBuy?.(property)}
            >
              Comprar
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PropertieCard;
