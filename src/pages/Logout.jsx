// src/pages/Logout.jsx
// Página de cierre de sesión elegante con confirmación y navegación automática

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const { logoutAxios, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending"); // pending | done | canceled

  useEffect(() => {
    handleLogout();
  }, []);

  // Función para cerrar sesión
  async function handleLogout() {
    try {
      await logoutAxios();
      setStatus("done");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      setStatus("error");
    }
  }

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow border-0 p-4 text-center" style={{ maxWidth: "400px" }}>
        {status === "pending" && (
          <>
            <div className="spinner-border text-warning mb-3" role="status"></div>
            <h5 className="fw-bold">Cerrando sesión...</h5>
            <p className="text-muted small mt-2">Por favor, espera un momento.</p>
          </>
        )}

        {status === "done" && (
          <>
            <h3 className="text-warning fw-bold mb-2">👋 Sesión cerrada</h3>
            <p className="text-muted mb-3">Esperamos verte pronto en KameHouse.</p>
            <div className="spinner-border spinner-border-sm text-warning" role="status"></div>
          </>
        )}



        {status === "error" && (
          <>
            <h4 className="text-danger fw-bold">❌ Error</h4>
            <p className="text-muted">Hubo un problema cerrando tu sesión.</p>
          </>
        )}
      </div>
    </div>
  );
}
