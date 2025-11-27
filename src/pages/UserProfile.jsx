// src/pages/UserProfile.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { adminListOrders } from "../api/xano.js";
import "./UserProfile.css";

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

// ============================
// 🔎 Helper para leer el rol igual que en App.jsx
// ============================
function getRoleFromUser(user) {
  if (!user) return "";

  // role como string plano
  if (typeof user.role === "string" && user.role.trim() !== "") {
    return user.role.toLowerCase();
  }

  // role como objeto relacionado { id, name }
  if (user.role && typeof user.role === "object") {
    if (typeof user.role.name === "string") {
      return user.role.name.toLowerCase();
    }
    if (user.role.id === 1) return "admin";
    if (user.role.id === 2) return "cliente";
  }

  // role_id como entero
  if (user.role_id != null) {
    const id = Number(user.role_id);
    if (id === 1) return "admin";
    if (id === 2) return "cliente";
  }

  return "";
}

export default function UserProfile() {
  const { user, token, updateProfileAxios } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pestaña activa: profile | progress (admin) | orders (cliente)
  const [tab, setTab] = useState("profile");

  // Estado local para el formulario
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    shipping_address: "",
  });

  // Órdenes (tanto para admin como cliente)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [ordersFilter, setOrdersFilter] = useState("all"); // all | sent | pending | cancelled

  if (!user) {
    return (
      <main className="profile-page">
        <p className="profile-empty">No hay usuario en sesión.</p>
      </main>
    );
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    shipping_address,
    id,
  } = user;

  // ============================
  //  🔎 Rol para mostrar en pantalla (unificado)
  // ============================
  const roleKey = getRoleFromUser(user); // "admin" | "cliente" | ""
  const isAdmin = roleKey === "admin";
  const isClient = roleKey === "cliente" || !isAdmin;

  const displayRole = roleKey || "sin";
  const prettyRole =
    roleKey === "admin"
      ? "Admin"
      : roleKey === "cliente"
        ? "Cliente"
        : "Sin Rol";

  const fullName = `${first_name ?? ""} ${last_name ?? ""}`.trim();
  const initials =
    (first_name?.[0] || "").toUpperCase() +
    (last_name?.[0] || "").toUpperCase();

  // ============================
  //  ✏️ EDICIÓN PERFIL
  // ============================
  const startEditing = () => {
    setFormData({
      first_name: first_name || "",
      last_name: last_name || "",
      phone: phone || "",
      shipping_address: shipping_address || "",
    });
    setIsEditing(true);
    setError(null);
    setTab("profile");
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await updateProfileAxios(id, formData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el perfil. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  //  📦 CARGA DE ÓRDENES (admin/cliente)
  // ============================
  useEffect(() => {
    if (!token) return;

    const needsOrders =
      (isAdmin && tab === "progress") || (isClient && tab === "orders");

    if (!needsOrders) return;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const data = await adminListOrders(token);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando órdenes:", err);
        setOrdersError("No se pudieron cargar tus órdenes.");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [token, tab, isAdmin, isClient]);

  // ============================
  //  📊 PROGRESO ADMIN
  // ============================
  const adminConfirmedOrders = isAdmin
    ? orders.filter(
      (o) => o.status === "enviado" && o.confirmed_by === user.id
    )
    : [];

  const adminStats = {
    totalConfirmed: adminConfirmedOrders.length,
    totalRevenue: adminConfirmedOrders.reduce(
      (sum, o) => sum + (Number(o.total) || 0),
      0
    ),
    recent: [...adminConfirmedOrders]
      .sort((a, b) => {
        const aT = a.updated_at || a.created_at || 0;
        const bT = b.updated_at || b.created_at || 0;
        return bT - aT;
      })
      .slice(0, 5),
  };

  // ============================
  //  🧾 ÓRDENES DEL CLIENTE
  // ============================
  const myOrders = isClient
    ? orders.filter(
      (o) => o.user_id === id || (email && o.user_email === email)
    )
    : [];

  const totalOrders = myOrders.length;
  const sentOrders = myOrders.filter((o) => o.status === "enviado");
  const pendingOrders = myOrders.filter((o) => o.status === "pendiente");
  const cancelledOrders = myOrders.filter((o) => o.status === "cancelado");

  const totalSent = sentOrders.length;
  const totalPending = pendingOrders.length;
  const totalCancelled = cancelledOrders.length;

  const totalSpent = sentOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  // Filtro de tabla
  const filteredOrders = myOrders.filter((o) => {
    if (ordersFilter === "sent") return o.status === "enviado";
    if (ordersFilter === "pending") return o.status === "pendiente";
    if (ordersFilter === "cancelled") return o.status === "cancelado";
    return true;
  });

  // Helpers de estado
  const statusLabel = (status) => {
    if (status === "enviado") return "Enviado";
    if (status === "pendiente") return "Pendiente";
    if (status === "cancelado") return "Rechazado";
    return status || "—";
  };

  const statusClass = (status) => {
    if (status === "enviado") return "status-pill status-pill--sent";
    if (status === "pendiente") return "status-pill status-pill--pending";
    if (status === "cancelado") return "status-pill status-pill--cancelled";
    return "status-pill";
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("es-CL");
  };

  // 🔍 Resumen de productos comprados por orden
  const orderProductsSummary = (order) => {
    const items = Array.isArray(order.products_bought)
      ? order.products_bought
      : [];

    if (!items.length) return "—";

    return items
      .map((item) => {
        const qty =
          Number(
            item.quantity ??
            item.cantidad ??
            item.qty ??
            item.cant ??
            1
          ) || 1;
        const name =
          item.name ||
          item.product_name ||
          item.title ||
          `ID ${item.product_id ?? "?"}`;
        return `${qty}× ${name}`;
      })
      .join(" · ");
  };

  // ============================
  //  RENDER
  // ============================
  return (
    <main
      className={`profile-page ${isAdmin ? "profile-page-admin" : "profile-page-client"
        }`}
    >
      {/* HEADER */}
      <section className="profile-header">
        <div>
          <h1 className="profile-title">Mi perfil</h1>
          <p className="profile-subtitle">
            Gestión de tu cuenta en la tienda KameHouse.
          </p>
        </div>

        <div className="d-flex gap-3 align-items-center">
          <span className={`role-chip role-${displayRole || "default"}`}>
            {prettyRole}
          </span>

          {/* Botón editar solo en pestaña de perfil */}
          {tab === "profile" && !isEditing && (
            <button
              className="btn btn-outline-warning btn-sm"
              onClick={startEditing}
            >
              Editar perfil
            </button>
          )}
        </div>
      </section>

      {/* CARD PRINCIPAL */}
      <section className="profile-card">
        {/* LADO IZQUIERDO */}
        <div className="profile-left">
          <div className="profile-avatar">
            <span>{initials || "KH"}</span>
          </div>

          <div className="profile-name-block">
            <h2>{fullName || "Usuario KameHouse"}</h2>
            <p>{email || "Sin correo"}</p>
          </div>

          {/* Menú para admin / cliente */}
          <div className="profile-admin-menu">
            <button
              className={`profile-tab-btn ${tab === "profile" ? "active" : ""
                }`}
              onClick={() => {
                setTab("profile");
                setIsEditing(false);
              }}
            >
              Datos de perfil
            </button>

            {isAdmin && (
              <button
                className={`profile-tab-btn ${tab === "progress" ? "active" : ""
                  }`}
                onClick={() => {
                  setTab("progress");
                  setIsEditing(false);
                }}
              >
                Tu progreso
              </button>
            )}

            {isClient && (
              <button
                className={`profile-tab-btn ${tab === "orders" ? "active" : ""
                  }`}
                onClick={() => {
                  setTab("orders");
                  setIsEditing(false);
                }}
              >
                Mis pedidos
              </button>
            )}
          </div>
        </div>

        {/* LADO DERECHO */}
        <div className="profile-right">
          {/* Errores de perfil */}
          {error && tab === "profile" && (
            <div className="alert alert-danger mb-3">{error}</div>
          )}

          {/* ========= VISTA PROGRESO ADMIN ========= */}
          {tab === "progress" && isAdmin ? (
            <div className="profile-progress">
              <h2 className="profile-section-title">Tu progreso como admin</h2>

              {ordersLoading && (
                <p className="text-muted">Cargando estadísticas...</p>
              )}
              {ordersError && (
                <div className="alert alert-danger">{ordersError}</div>
              )}

              {!ordersLoading && !ordersError && (
                <>
                  <div className="row g-3 mb-4 profile-orders">
                    <div className="col-md-6 col-lg-3">
                      <div className="profile-order-card">
                        <div className="small-label">Órdenes confirmadas</div>
                        <div className="big-value">
                          {adminStats.totalConfirmed}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 col-lg-3">
                      <div className="profile-order-card">
                        <div className="small-label">Monto generado</div>
                        <div className="big-value">
                          {CLP.format(adminStats.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="section-subtitle">Últimas confirmaciones</h3>

                  {adminStats.recent.length === 0 ? (
                    <p className="text-muted">
                      Aún no has confirmado órdenes con este usuario admin.
                    </p>
                  ) : (
                    <div className="orders-table-wrapper">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>ID Orden</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats.recent.map((o) => (
                            <tr key={o.id}>
                              <td className="orders-cell-id">#{o.id}</td>
                              <td>{o.user_email || o.user_id || "—"}</td>
                              <td className="orders-cell-total">
                                {CLP.format(Number(o.total) || 0)}
                              </td>
                              <td>
                                <span className={statusClass(o.status)}>
                                  {statusLabel(o.status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}

          {/* ========= VISTA MIS PEDIDOS (CLIENTE) ========= */}
          {tab === "orders" && isClient ? (
            <div className="profile-orders">
              <h2 className="profile-section-title">Mis pedidos y envíos</h2>

              {ordersLoading && (
                <p className="text-muted">Cargando tus pedidos...</p>
              )}
              {ordersError && (
                <div className="alert alert-danger">{ordersError}</div>
              )}

              {!ordersLoading && !ordersError && (
                <>
                  {/* RESUMEN SUPERIOR */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-3 col-sm-6">
                      <div className="profile-order-card">
                        <div className="small-label">Órdenes totales</div>
                        <div className="big-value">{totalOrders}</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="profile-order-card">
                        <div className="small-label">Enviadas</div>
                        <div
                          className="big-value"
                          style={{ color: "#52c41a" }}
                        >
                          {totalSent}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="profile-order-card">
                        <div className="small-label">Pendientes</div>
                        <div
                          className="big-value"
                          style={{ color: "#ffc857" }}
                        >
                          {totalPending}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="profile-order-card">
                        <div className="small-label">Rechazadas</div>
                        <div
                          className="big-value"
                          style={{ color: "#ff4d4f" }}
                        >
                          {totalCancelled}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TOTAL GASTADO */}
                  <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
                    <p
                      style={{
                        marginBottom: 4,
                        fontSize: "0.9rem",
                        opacity: 0.8,
                      }}
                    >
                      Total gastado en pedidos enviados
                    </p>
                    <div className="orders-total-spent">
                      {CLP.format(totalSpent)}
                    </div>
                  </div>

                  {/* FILTROS */}
                  <div className="orders-filter-row">
                    <span style={{ fontSize: "0.95rem" }}>
                      Filtrar por estado:
                    </span>
                    <div className="orders-filter-buttons">
                      <button
                        className={`orders-filter-btn ${ordersFilter === "all" ? "active" : ""
                          }`}
                        onClick={() => setOrdersFilter("all")}
                      >
                        Todos
                      </button>
                      <button
                        className={`orders-filter-btn ${ordersFilter === "sent" ? "active" : ""
                          }`}
                        onClick={() => setOrdersFilter("sent")}
                      >
                        Enviados (aceptados)
                      </button>
                      <button
                        className={`orders-filter-btn ${ordersFilter === "pending" ? "active" : ""
                          }`}
                        onClick={() => setOrdersFilter("pending")}
                      >
                        Pendientes
                      </button>
                      <button
                        className={`orders-filter-btn ${ordersFilter === "cancelled" ? "active" : ""
                          }`}
                        onClick={() => setOrdersFilter("cancelled")}
                      >
                        Rechazados
                      </button>
                    </div>
                  </div>

                  {/* TABLA */}
                  {filteredOrders.length === 0 ? (
                    <p className="text-muted">
                      No se encontraron pedidos con ese estado.
                    </p>
                  ) : (
                    <div className="orders-table-wrapper">
                      <table className="orders-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Estado</th>
                            <th>Productos</th>
                            <th>Total</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((o) => (
                            <tr key={o.id}>
                              <td className="orders-cell-id">#{o.id}</td>
                              <td>
                                <span className={statusClass(o.status)}>
                                  {statusLabel(o.status)}
                                </span>
                              </td>
                              <td className="orders-cell-products">
                                {orderProductsSummary(o)}
                              </td>
                              <td className="orders-cell-total">
                                {CLP.format(Number(o.total) || 0)}
                              </td>
                              <td className="orders-cell-date">
                                {formatDate(o.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}

          {/* ========= VISTA PERFIL NORMAL ========= */}
          {tab === "profile" && (
            <>
              <div className="profile-grid">
                <div className="profile-row">
                  <span className="label">ID</span>
                  <span className="value">#{id ?? "—"}</span>
                </div>

                <div className="profile-row">
                  <span className="label">Rol actual</span>
                  <span className="value">{prettyRole}</span>
                </div>

                {/* NOMBRE */}
                <div className="profile-row">
                  <span className="label">Nombre</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          first_name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span className="value">
                      {first_name || "No especificado"}
                    </span>
                  )}
                </div>

                {/* APELLIDO */}
                <div className="profile-row">
                  <span className="label">Apellido</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          last_name: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span className="value">
                      {last_name || "No especificado"}
                    </span>
                  )}
                </div>

                <div className="profile-row">
                  <span className="label">Correo</span>
                  <span className="value">{email || "—"}</span>
                </div>

                {/* TELÉFONO */}
                <div className="profile-row">
                  <span className="label">Teléfono</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span className="value">
                      {phone || "No especificado"}
                    </span>
                  )}
                </div>

                {/* DIRECCIÓN */}
                <div className="profile-row" style={{ gridColumn: "1 / -1" }}>
                  <span className="label">Dirección de envío</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control form-control-sm bg-dark text-light border-secondary"
                      value={formData.shipping_address}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <span className="value">
                      {shipping_address || "No especificada"}
                    </span>
                  )}
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-4 d-flex justify-content-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={cancelEditing}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-warning btn-sm fw-bold"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </>
                ) : (
                  <Link to="/logout" className="btn btn-danger fw-bold">
                    Cerrar cuenta
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
