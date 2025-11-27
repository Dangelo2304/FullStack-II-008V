// src/components/UserBar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserBar() {
  const { user } = useAuth();

  // Si no hay usuario logueado, no mostramos nada
  if (!user) return null;

  // Detectar rol de forma más robusta
  let rawRole = "";

  if (typeof user.role === "string") {
    rawRole = user.role;
  } else if (user.role && typeof user.role === "object") {
    rawRole = user.role.name || "";
  } else if (user.role_id != null) {
    rawRole = Number(user.role_id) === 1 ? "admin" : "cliente";
  }

  const role = rawRole.toString().toLowerCase();
  const isAdmin = role === "admin";

  // Nombre bonito
  const displayName =
    (user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name ||
      user.name ||
      user.full_name ||
      (user.email ? user.email.split("@")[0] : "")) || "Usuario";

  const roleLabel = isAdmin ? "Admin" : "Cliente";

  return (
    <div
      className="kame-user-banner shadow-sm mb-4"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,184,77,0.2), rgba(5,0,0,0.9))",
        border: "1px solid rgba(255,196,120,0.7)",
        borderRadius: "999px",
        padding: "0.55rem 1.6rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        color: "#ffe6b0",
      }}
    >
      {/* Etiqueta "Usuario" */}
      <span
        style={{
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "#ffcc80",
        }}
      >
        Usuario:
      </span>

      {/* Nombre */}
      <span
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "#ffffff",
        }}
      >
        {displayName}
      </span>

      {/* Separador / Rol */}
      <span
        style={{
          fontSize: "0.8rem",
          padding: "0.15rem 0.8rem",
          borderRadius: "999px",
          border: "1px solid rgba(255,196,120,0.6)",
          marginLeft: "0.25rem",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: isAdmin ? "#ffe29a" : "#ffd9a0",
          background: isAdmin
            ? "radial-gradient(circle at 30% 0, #ffe29a 0, #ff9100 40%, #5a2500 100%)"
            : "rgba(0,0,0,0.35)",
          boxShadow: isAdmin
            ? "0 0 14px rgba(255,145,0,0.7)"
            : "0 0 8px rgba(0,0,0,0.7)",
        }}
      >
        {roleLabel}
      </span>
    </div>
  );
}
