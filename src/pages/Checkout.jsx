// src/pages/Checkout.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { createOrder } from "../api/xano";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";
import MonthYearPicker from "../components/MonthYearPicker.jsx";

const MAX_CARD_DIGITS = 16;

export default function Checkout() {
  const { user, token } = useAuth();
  const { cart, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/AA
  const [cvv, setCvv] = useState("");
  const [address, setAddress] = useState(user?.shipping_address || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 Pantallita de carga estilo gamer
  const [loadingScreen, setLoadingScreen] = useState({
    visible: false,      // muestra/oculta overlay
    step: "loading",     // "loading" | "success"
  });

  const isEmpty = cart.length === 0;

  // ==========================
  // 🔢 FORMATOS DE INPUT
  // ==========================

  function formatCardNumber(raw) {
    const digits = raw.replace(/\D/g, "").slice(0, MAX_CARD_DIGITS);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(" ");
  }

  function handleCardNumberChange(e) {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  }

  function handleExpiryChange(e) {
    let digits = e.target.value.replace(/\D/g, "").slice(0, 4);

    let value = digits;
    if (digits.length >= 3) {
      value = digits.slice(0, 2) + "/" + digits.slice(2);
    }

    setExpiry(value);
  }

  function handleCvvChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(digits);
  }

  // ==========================
  // ✅ VALIDACIÓN BÁSICA
  // ==========================

  function basicValidate() {
    if (!firstName.trim() || !lastName.trim()) {
      return "Debes ingresar el nombre y apellido del titular.";
    }

    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (cleanCard.length < 13 || cleanCard.length > 16) {
      return "El número de tarjeta no parece válido.";
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return "La fecha de vencimiento debe tener formato MM/AA.";
    }

    const parts = expiry.split("/");
    const mm = Number(parts[0]);
    if (isNaN(mm) || mm < 1 || mm > 12) {
      return "El mes de vencimiento debe ser entre 01 y 12.";
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return "El CVV debe tener 3 o 4 dígitos.";
    }

    if (!address.trim()) {
      return "Debes ingresar una dirección de facturación.";
    }

    return "";
  }

  // ==========================
  // 💳 PAGAR
  // ==========================

  async function handlePay(e) {
    e.preventDefault();
    setError("");

    if (isEmpty) {
      setError("Tu carrito está vacío.");
      return;
    }

    const validationMsg = basicValidate();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setLoading(true);
    // Mostrar overlay de carga
    setLoadingScreen({ visible: true, step: "loading" });

    try {
      const items = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const cleanCardNumber = cardNumber.replace(/\s+/g, "");

      const reserved_stock = {};
      for (const it of cart) {
        const currentStock = Number(it.stock || 0);
        const qty = Number(it.quantity || 0);
        reserved_stock[it.id] = Math.max(0, currentStock - qty);
      }

      await createOrder({
        token,
        user_id: user.id,
        items,
        total,
        cardNumber: cleanCardNumber,
        reserved_stock,
      });

      // Cambiamos la pantalla a "éxito"
      setLoadingScreen({ visible: true, step: "success" });

      // Dejamos que el usuario vea el estado confirmado un momento
      setTimeout(() => {
        clearCart();
        setLoading(false);
        setLoadingScreen({ visible: false, step: "loading" });
        navigate("/home");
      }, 1500);
    } catch (err) {
      console.error("❌ Error en pago:", err);
      setError("No se pudo procesar el pago. Intenta nuevamente.");
      setLoading(false);
      setLoadingScreen({ visible: false, step: "loading" });
    }
  }

  // ==========================
  // 🖥️ UI
  // ==========================

  return (
    <div className="checkout-container">
      <div className="container">
        {/* HEADER */}
        <div className="checkout-header">
          <h1 className="checkout-title">Confirmar Compra</h1>
        </div>

        {isEmpty ? (
          <div className="checkout-empty">
            <p className="checkout-empty-text">
              Tu carrito está vacío. Primero agrega productos.
            </p>
            <a href="/home" className="checkout-empty-btn">
              Ir a Tienda
            </a>
          </div>
        ) : (
          <div className="checkout-content">
            {/* FORMULARIO */}
            <div className="checkout-form-container">
              <h2 className="checkout-form-title">Información de Pago</h2>

              {error && <div className="checkout-alert error">{error}</div>}

              <form onSubmit={handlePay} autoComplete="off" spellCheck="false">
                {/* Nombre y Apellido */}
                <div className="checkout-form-row">
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      Nombre del titular
                    </label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      Apellido del titular
                    </label>
                    <input
                      type="text"
                      className="checkout-form-input"
                      placeholder="Pérez"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Número de Tarjeta */}
                <div className="checkout-form-group">
                  <label className="checkout-form-label">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    className="checkout-form-input"
                    placeholder="1111 2222 3333 4444"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onFocus={() => setError("")}
                    inputMode="numeric"
                    required
                    autoComplete="off"
                    name="cc_number_tmp"
                    data-lpignore="true"
                    aria-label="Número de tarjeta"
                  />
                </div>

                {/* Fecha de Vencimiento y CVV */}
                <div className="checkout-form-row">
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">
                      Vencimiento (MM/AA)
                    </label>
                    <MonthYearPicker value={expiry} onChange={setExpiry} />
                  </div>
                  <div className="checkout-form-group">
                    <label className="checkout-form-label">CVV</label>
                    <input
                      type="password"
                      className="checkout-form-input"
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                      inputMode="numeric"
                      required
                      autoComplete="off"
                      name="cc_cvv_tmp"
                      data-lpignore="true"
                      aria-label="CVV"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="checkout-form-group">
                  <label className="checkout-form-label">
                    Dirección de Facturación
                  </label>
                  <input
                    type="text"
                    className="checkout-form-input"
                    placeholder="Calle, número, comuna, ciudad"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <button
                  className="checkout-btn"
                  type="submit"
                  disabled={loading || isEmpty}
                >
                  {loading ? "Procesando..." : "Confirmar Pago"}
                </button>
              </form>
            </div>

            {/* RESUMEN */}
            <div className="checkout-summary">
              <h2 className="checkout-summary-title">Resumen</h2>

              <div className="checkout-summary-item">
                <span>Productos:</span>
                <strong>{cart.length}</strong>
              </div>

              {cart.map((item) => (
                <div key={item.id} className="checkout-summary-item">
                  <span>{item.name}</span>
                  <strong>
                    $
                    {(item.price * item.quantity).toLocaleString("es-CL")}
                  </strong>
                </div>
              ))}

              <div className="checkout-summary-item">
                <span className="checkout-summary-total">Total</span>
                <span className="checkout-summary-total">
                  ${Number(total || 0).toLocaleString("es-CL")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 Overlay gamer de carga / éxito */}
      {loadingScreen.visible && (
        <div className="checkout-loading-overlay">
          <div className="checkout-loading-box">
            {loadingScreen.step === "loading" ? (
              <>
                <div className="loader-spinner"></div>
                <p className="loader-text">Confirmando compra...</p>
              </>
            ) : (
              <>
                <div className="loader-check"></div>
                <p className="loader-text">¡Compra confirmada!</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
