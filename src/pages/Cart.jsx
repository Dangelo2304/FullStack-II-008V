// src/pages/Cart.jsx
import { useCart } from "../context/CartContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import "./Cart.css";

export default function Cart() {
  const { cart, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const isEmpty = cart.length === 0;

  function handleCheckout() {
    if (isEmpty) return;
    navigate("/checkout");
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1 className="cart-title">CARRITO DE COMPRAS</h1>
        <p className="cart-subtitle">{cart.length} artículos en tu carrito</p>
      </div>

      {isEmpty && (
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <h3>Tu carrito está vacío</h3>
          <p>¡Agrega algunos artículos para comenzar!</p>
          <Link to="/home" className="cart-btn-continue">
            IR A LA TIENDA
          </Link>
        </div>
      )}

      {!isEmpty && (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="no-image">SIN IMAGEN</div>
                  )}
                </div>

                <div className="cart-item-details">
                  <h4 className="item-name">{item.name}</h4>
                  {item.genero && (
                    <p className="item-genero">{item.genero}</p>
                  )}
                  <p className="item-price">
                    ${Number(item.price || 0).toLocaleString("es-CL")}
                  </p>
                </div>

                <div className="cart-item-quantity">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                  >
                    −
                  </button>
                  <span className="qty-display">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  {item.stock != null && (
                    <span className="item-stock">Stock: {item.stock}</span>
                  )}
                </div>

                <div className="cart-item-subtotal">
                  $
                  {Number(
                    item.price * item.quantity || 0
                  ).toLocaleString("es-CL")}
                </div>

                <button
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.id)}
                  title="Quitar del carrito"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-header">RESUMEN DEL PEDIDO</div>

            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${Number(total || 0).toLocaleString("es-CL")}</span>
            </div>

            <div className="summary-row">
              <span>Envío:</span>
              <span className="envio-text">Gratis</span>
            </div>

            <div className="summary-row">
              <span>Impuestos:</span>
              <span>${Number((total * 0.19) || 0).toLocaleString("es-CL")}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>TOTAL:</span>
              <span>${Number((total * 1.19) || 0).toLocaleString("es-CL")}</span>
            </div>

            <button
              className="cart-btn-checkout"
              disabled={isEmpty}
              onClick={handleCheckout}
            >
              PROCEDER AL PAGO
            </button>

            <Link to="/home" className="cart-btn-continue">
              CONTINUAR COMPRANDO
            </Link>

            <button
              className="cart-btn-clear"
              onClick={clearCart}
            >
              VACIAR CARRITO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
