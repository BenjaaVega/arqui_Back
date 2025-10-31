import React from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const audience = import.meta.env.VITE_AUTH0_AUDIENCE; // https://api.g6-arquisis.com

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

export function useApiAuth() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  React.useEffect(() => {
    const id = api.interceptors.request.use(async (config) => {
      if (!isAuthenticated) return config;
      try {
        const token = await getAccessTokenSilently({
          audience: "https://api.g6-arquisis.com",   // EXACTO al Identifier de tu API
          scope: "openid profile email"
        });
        console.log("Token obtenido exitosamente para API:", "https://api.g6-arquisis.com");
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      } catch (error) {
        console.error("Error obteniendo token de Auth0:", error);
      }
      return config;
    });
    return () => api.interceptors.request.eject(id);
  }, [getAccessTokenSilently, isAuthenticated]);
}
