import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ojoAbierto from "../../img/ojo abierto.png";
import ojoCerrado from "../../img/ojo-cerrado.png";

export default function Register() {
  const { registerAxios } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    shipping_address: "",
    phone: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Validaciones mínimas
    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      return setMsg({ type: "danger", text: "Completa los campos obligatorios." });
    }

    setLoading(true);
    try {
      await registerAxios({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        shipping_address: form.shipping_address.trim(),
        phone: form.phone.trim(),
      });

      setMsg({ type: "success", text: "Cuenta creada. ¡Bienvenido a KameHouse!" });
      // Pequeño delay para que se vea el mensaje y luego redirigir
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      setMsg({
        type: "danger",
        text:
          err?.message ||
          "No se pudo registrar. Revisa el correo/contraseña o intenta más tarde.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Estilos inline para replicar la tarjeta del login
  const shell = {
    minHeight: "calc(100vh - 72px)",
    display: "grid",
    placeItems: "center",
    background: "transparent",
    paddingTop: "12px",
    paddingBottom: "2rem",
  };

  const card = {
    width: "min(480px, 100%)",
    maxWidth: "480px",
    background:
      "linear-gradient(145deg, rgba(10,6,3,0.98), rgba(22,12,5,0.98))",
    border: "2px solid rgba(255,146,52,0.4)",
    borderRadius: "1rem",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 40px rgba(255,146,52,0.1)",
    color: "#fff",
    margin: "0 1rem",
  };

  const title = {
    color: "#ff9f43",
    fontWeight: 900,
    letterSpacing: "0.15em",
    textAlign: "center",
    textTransform: "uppercase",
    fontSize: "1.8rem",
    textShadow: "0 3px 10px rgba(255,146,52,0.3)",
    marginBottom: "1.5rem",
    paddingBottom: "1.2rem",
    borderBottom: "2px solid rgba(255,146,52,0.25)",
  };

  const label = {
    color: "#fff",
    fontSize: "0.9rem",
    marginBottom: "0.6rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: "bold",
  };

  const inputStyle = {
    background:
      "linear-gradient(180deg, rgba(255,127,50,0.08), rgba(0,0,0,0.8))",
    border: "1.5px solid rgba(255,146,52,0.5)",
    borderLeft: "4px solid rgba(255,146,52,0.7)",
    color: "#fff",
    padding: "0.75rem 1rem",
    borderRadius: "0.7rem",
    fontSize: "0.95rem",
    transition: "all 0.25s ease",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
  };

  const buttonStyle = {
    background:
      "linear-gradient(135deg, #ff9f43 0%, #ff7e1d 50%, #ffb347 100%)",
    border: "2px solid rgba(255,100,0,0.6)",
    color: "#1b0f06",
    paddingBlock: "0.85rem",
    paddingInline: "2rem",
    borderRadius: "0.7rem",
    boxShadow:
      "0 8px 24px rgba(255,146,52,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
    fontSize: "1rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 900,
    transition: "all 0.2s ease",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={shell} className="px-3">
      <div style={card} className="card-body p-5">
        {/* Header with accent bar */}
        <div style={{ marginBottom: "1.5rem", paddingBottom: "1.2rem", borderBottom: "2px solid rgba(255,146,52,0.25)" }}>
          <h2 style={title}>
            Crear cuenta
          </h2>
          <div
            style={{
              textAlign: "center",
              marginTop: "0.6rem",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
            }}
          >
            Únete a KameHouse
          </div>
        </div>

        <form onSubmit={onSubmit} className="d-grid gap-4">
          {/* EMAIL */}
          <div>
            <label className="form-label" style={label}>
              Correo Electrónico *
            </label>
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="usuario@ejemplo.com"
              value={form.email}
              onChange={onChange}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(255,146,52,0.8)";
                e.target.style.boxShadow = "0 0 12px rgba(255,146,52,0.3), inset 0 2px 4px rgba(0,0,0,0.3)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,146,52,0.5)";
                e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
              }}
            />
            <style>{`
              input[name="email"]::placeholder { color: #c0c0c0; opacity: 1; }
              input[name="email"]::-webkit-input-placeholder { color: #c0c0c0; }
              input[name="email"]:-ms-input-placeholder { color: #c0c0c0; }
              input[name="email"]::-moz-placeholder { color: #c0c0c0; opacity: 1; }
            `}</style>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="form-label" style={label}>
              Contraseña *
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="form-control"
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={onChange}
                minLength={6}
                required
                style={{ ...inputStyle, paddingRight: "2.5rem" }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.8)";
                  e.target.style.boxShadow = "0 0 12px rgba(255,146,52,0.3), inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.5)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
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
                <img src={showPass ? ojoCerrado : ojoAbierto} alt={showPass ? "ocultar" : "mostrar"} style={{ height: 20, filter: 'invert(1) brightness(1.2)' }} />
              </button>
            </div>
            <style>{`
              input[name="password"]::placeholder { color: #c0c0c0; opacity: 1; }
              input[name="password"]::-webkit-input-placeholder { color: #c0c0c0; }
              input[name="password"]:-ms-input-placeholder { color: #c0c0c0; }
              input[name="password"]::-moz-placeholder { color: #c0c0c0; opacity: 1; }
            `}</style>
          </div>

          {/* NOMBRES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" style={label}>
                Nombres *
              </label>
              <input
                className="form-control"
                name="first_name"
                placeholder="Tu nombre"
                value={form.first_name}
                onChange={onChange}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.8)";
                  e.target.style.boxShadow = "0 0 12px rgba(255,146,52,0.3), inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.5)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
              <style>{`
                input[name="first_name"]::placeholder { color: #c0c0c0; opacity: 1; }
                input[name="first_name"]::-webkit-input-placeholder { color: #c0c0c0; }
                input[name="first_name"]:-ms-input-placeholder { color: #c0c0c0; }
                input[name="first_name"]::-moz-placeholder { color: #c0c0c0; opacity: 1; }
              `}</style>
            </div>

            <div>
              <label className="form-label" style={label}>
                Apellidos *
              </label>
              <input
                className="form-control"
                name="last_name"
                placeholder="Tus apellidos"
                value={form.last_name}
                onChange={onChange}
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.8)";
                  e.target.style.boxShadow = "0 0 12px rgba(255,146,52,0.3), inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.5)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
              <style>{`
                input[name="last_name"]::placeholder { color: #c0c0c0; opacity: 1; }
                input[name="last_name"]::-webkit-input-placeholder { color: #c0c0c0; }
                input[name="last_name"]:-ms-input-placeholder { color: #c0c0c0; }
                input[name="last_name"]::-moz-placeholder { color: #c0c0c0; opacity: 1; }
              `}</style>
            </div>
          </div>

          {/* TELÉFONO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" style={label}>
                Teléfono
              </label>
              <input
                className="form-control"
                name="phone"
                placeholder="+56 9 1234 5678"
                value={form.phone}
                onChange={onChange}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.8)";
                  e.target.style.boxShadow = "0 0 12px rgba(255,146,52,0.3), inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.5)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
              <style>{`
                input[name="phone"]::placeholder { color: #c0c0c0; opacity: 1; }
                input[name="phone"]::-webkit-input-placeholder { color: #c0c0c0; }
                input[name="phone"]:-ms-input-placeholder { color: #c0c0c0; }
                input[name="phone"]::-moz-placeholder { color: #c0c0c0; opacity: 1; }
              `}</style>
            </div>

            <div>
              <label className="form-label" style={label}>
                Dirección de envío
              </label>
              <input
                className="form-control"
                name="shipping_address"
                placeholder="Calle 123, Comuna"
                value={form.shipping_address}
                onChange={onChange}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.8)";
                  e.target.style.boxShadow = "0 0 12px rgba(255,146,52,0.3), inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,146,52,0.5)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.3)";
                }}
              />
              <style>{`
                input[name="shipping_address"]::placeholder { color: #c0c0c0; opacity: 1; }
                input[name="shipping_address"]::-webkit-input-placeholder { color: #c0c0c0; }
                input[name="shipping_address"]:-ms-input-placeholder { color: #c0c0c0; }
                input[name="shipping_address"]::-moz-placeholder { color: #c0c0c0; opacity: 1; }
              `}</style>
            </div>
          </div>

          {/* MENSAJES */}
          {msg.text && (
            <div
              style={{
                background: msg.type === "success" ? "rgba(100,200,100,0.15)" : "rgba(255,100,100,0.15)",
                border: msg.type === "success" ? "1px solid rgba(100,200,100,0.5)" : "1px solid rgba(255,100,100,0.5)",
                color: msg.type === "success" ? "#b3ffb3" : "#ffb3b3",
                borderRadius: "0.6rem",
                padding: "0.8rem",
              }}
              role="alert"
            >
              {msg.text}
            </div>
          )}

          {/* BOTÓN CREAR */}
          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 12px 28px rgba(255,146,52,0.6), inset 0 1px 0 rgba(255,255,255,0.2)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 8px 24px rgba(255,146,52,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
              }
            }}
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "1.8rem",
            paddingTop: "1.2rem",
            borderTop: "1px solid rgba(255,146,52,0.15)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem" }}>
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="fw-bold text-decoration-none"
              style={{
                color: "#ffd180",
                transition: "all 0.2s ease",
                textShadow: "0 0 8px rgba(255,209,128,0.5)",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#ffb347";
                e.target.style.textShadow = "0 0 12px rgba(255,179,71,0.7)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#ffd180";
                e.target.style.textShadow = "0 0 8px rgba(255,209,128,0.5)";
              }}
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
