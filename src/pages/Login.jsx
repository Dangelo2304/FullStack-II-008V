// src/pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import ojoAbierto from "../../img/ojo abierto.png";
import ojoCerrado from "../../img/ojo-cerrado.png";

export default function Login() {
  const { loginAxios } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await loginAxios({ email, password });

      if (!user) {
        throw new Error(
          "No se pudo cargar la información de tu cuenta. Intenta de nuevo."
        );
      }

      const role = (user.role || "").toLowerCase();

      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("❌ Error en handleSubmit:", err);
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  const shellStyle = {
    minHeight: "calc(100vh - 72px)",
    paddingTop: "12px",
    paddingBottom: "2rem",
    display: "grid",
    placeItems: "center",
  };

  const headerStyle = {
    marginBottom: "1.5rem",
    paddingBottom: "1.2rem",
    borderBottom: "2px solid rgba(255,146,52,0.25)",
  };

  const titleStyle = {
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#ff9f43",
    fontSize: "1.8rem",
    textShadow: "0 3px 10px rgba(255,146,52,0.3)",
  };

  const subtitleStyle = {
    textAlign: "center",
    marginTop: "0.6rem",
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.85rem",
    letterSpacing: "0.05em",
  };

  return (
    <div style={shellStyle} className="px-3">
      <div className="card shadow-lg border-0 kame-auth-card">
        <div className="card-body p-5">
          <div style={headerStyle}>
            <h2 className="text-center m-0" style={titleStyle}>
              Iniciar sesión
            </h2>
            <div style={subtitleStyle}>Accede a tu cuenta KameHouse</div>
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-4">
            <div>
              <label
                htmlFor="email"
                className="form-label"
                style={{ fontWeight: 700 }}
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Tu contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Mostrar u ocultar contraseña"
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={showPassword ? ojoCerrado : ojoAbierto}
                    alt={showPassword ? "ocultar" : "mostrar"}
                    style={{ height: 20, filter: "invert(1) brightness(1.2)" }}
                  />
                </button>
              </div>

            <button type="submit" className="kame-auth-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          {error && (
            <div
              className="alert alert-danger mt-3"
              style={{
                background: "rgba(255,100,100,0.15)",
                border: "1px solid rgba(255,100,100,0.5)",
                color: "#ffb3b3",
                borderRadius: "0.6rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              marginTop: "1.8rem",
              paddingTop: "1.2rem",
              borderTop: "1px solid rgba(255,146,52,0.15)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.95rem",
              }}
            >
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="fw-bold text-decoration-none"
                style={{
                  color: "#ffd180",
                  transition: "all 0.2s ease",
                }}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
