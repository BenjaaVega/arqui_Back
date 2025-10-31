import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { api, useApiAuth } from "../../lib/api";
import "./Profile.css";

const Profile = () => {
  useApiAuth();
  const { user } = useAuth0();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Cargar datos del perfil
  useEffect(() => {
  const loadProfile = async () => {
    try {
      // Intentar cargar desde el backend
      const response = await api.get("/me");
      console.log("Datos cargados del backend:", response.data);
      setProfile({
        name: response.data.name || user?.name || "",
        email: response.data.email || user?.email || "",
        phone: response.data.phone || ""
      });
    } catch (error) {
      // Si falla, usar datos de Auth0
      console.log("Error cargando del backend, usando Auth0:", error.message);
      setProfile({
        name: user?.name || "",
        email: user?.email || "",
        phone: ""
      });
    } finally {
      setLoading(false);
    }
  };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    console.log(" BOTÓN GUARDAR CLICKEADO");
    setSaving(true);
    setMessage("");

    try {
      console.log("Enviando datos al backend:", profile);
      const response = await api.put("/me", profile);
      console.log("Respuesta del backend:", response.data);
      setMessage("Perfil actualizado correctamente");
    } catch (error) {
      console.log("Error del backend:", error);
      setMessage("Error al actualizar el perfil");
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="main">
        <div className="main-header">
          <h1>Mi Perfil</h1>
          <div>Cargando...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="main-header">
        <h1>Mi Perfil</h1>
        <p>Gestiona tu información personal</p>
      </div>

      <div className="profile-container">
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Nombre completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Número de teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profile.phone}
              onChange={handleInputChange}
              placeholder="+56 9 1234 5678"
            />
          </div>

          {message && (
            <div className={`message ${message.includes('') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} className="save-button">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        <div className="profile-info">
          <h3>Información de la cuenta</h3>
          <div className="info-item">
            <strong>ID de usuario:</strong> {user?.sub}
          </div>
          <div className="info-item">
            <strong>Última actualización:</strong> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Profile;