import React from 'react';
import { Link } from 'react-router-dom';
import "./Landing.css";
import homeHero from "../../assets/home.png";

const Landing = () => {
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-copy">
          <h1>Properties Market by Legit Bussiness</h1>
          <h2>Agenda visitas de forma simple y segura</h2>
          <p>
            Explora propiedades en tiempo real y reserva tu visita pagando el
            <strong> 10% del precio de arriendo</strong>. Las compras se procesan de
            forma asíncrona mediante eventos, para que puedas seguir navegando mientras se valida tu solicitud.
          </p>

          <div className="cta">
            <Link to="/properties" className="btn primary">Explorar propiedades</Link>
            <Link to="/wallet" className="btn">Mi billetera</Link>
            <Link to="/visits" className="btn">Mis visitas</Link>
          </div>
        </div>

        <div className="hero-art">
          <img src={homeHero} alt="Ilustración de propiedades" className="hero-img" />
        </div>
      </header>

      <section className="panel">
        <div className="panel-content">
          <h2>¿Cómo funciona?</h2>
          <p className="sub">
            Nuestro frontend muestra propiedades provenientes del canal del broker y gestiona tus agendamientos como eventos.
          </p>

          <div className="info-grid">
            <div className="card">
              <h3>Explora</h3>
              <p>
                Listado filtrable y paginado de propiedades con precio, ubicación y disponibilidad de visitas,
                actualizado desde <code className="codechip">properties/info</code>.
              </p>
            </div>

            <div className="card">
              <h3>Compra asíncrona</h3>
              <p>
                Al agendar, publicamos una solicitud de compra en
                <code className="codechip"> properties/requests </code> con tu
                <code> request_id</code> (UUID) y <code>group_id</code>.
              </p>
            </div>

            <div className="card">
              <h3>Validación</h3>
              <p>
                Escuchamos <code className="codechip">properties/validation</code> para saber si tu solicitud fue
                <strong> ACCEPTED</strong>, <strong>OK</strong>, <strong>REJECTED</strong> o hubo <strong>error</strong>.
              </p>
            </div>

            <div className="card">
              <h3>Wallet</h3>
              <p>
                Recarga tu billetera y paga el 10% del arriendo para reservar la visita; si la validación falla, se revierte la disponibilidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="note">
        <div className="note-content">
          <h3>Que estas esperando!!!!!</h3>
          <p>
            Accede ya, y explora las mejores propiedades del mejor pais de Chile :), solo en Legit Businesss
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
