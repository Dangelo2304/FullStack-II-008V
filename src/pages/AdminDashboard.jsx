// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";
import {
  adminListProducts,
  adminDeleteProduct,
  adminListUsers,
  adminSetUserBlocked,
  adminDeleteUser,
  adminListOrders,
  confirmOrder,
  rejectOrder,
  uploadImage,
  createProduct,
  adminUpdateProduct,
  adminCreateUser,
  adminUpdateUser,
} from "../api/xano";

// Helper para formatear fecha
const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString("es-CL");
};

// Helper para obtener URLs de imágenes
const getImageUrls = (product) => {
  if (!product?.image) return [];
  const imgs = Array.isArray(product.image) ? product.image : [product.image];
  return imgs
    .map((img) => {
      if (!img) return "";
      if (typeof img === "string") {
        if (img.startsWith("/vault/") || img.startsWith("/"))
          return `https://x8ki-letl-twmt.n7.xano.io${img}`;
        return img;
      }
      if (img.url) return img.url;
      if (img.path) return `https://x8ki-letl-twmt.n7.xano.io${img.path}`;
      return "";
    })
    .filter(Boolean);
};

export default function AdminDashboard() {
  const { token, user } = useAuth();

  // Tabs
  const [tab, setTab] = useState("dashboard");

  // Data
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtros
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // --- ESTADO EDICIÓN PRODUCTO ---
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editGenero, setEditGenero] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editImages, setEditImages] = useState([]);
  const [editCurrentImages, setEditCurrentImages] = useState([]);
  const [editPreviews, setEditPreviews] = useState([]);
  const [editPrimaryIndex, setEditPrimaryIndex] = useState(0);

  // --- ESTADO CREACIÓN PRODUCTO ---
  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createStock, setCreateStock] = useState("");
  const [createGenero, setCreateGenero] = useState("");
  const [createDescripcion, setCreateDescripcion] = useState("");
  const [createImages, setCreateImages] = useState([]);
  const [createPreviews, setCreatePreviews] = useState([]);
  const [createPrimaryIndex, setCreatePrimaryIndex] = useState(0);
  const [createMessage, setCreateMessage] = useState("");

  // --- ESTADO CREACIÓN USUARIO ---
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState("");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    shipping_address: "",
    role: "cliente",
  });

  // --- ESTADO EDICIÓN USUARIO ---
  const [editingUser, setEditingUser] = useState(null);
  const [editUser, setEditUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    shipping_address: "",
    role: "cliente",
  });
  const [editUserMessage, setEditUserMessage] = useState("");

  // --- FLAG PARA EVITAR DOBLE CARGA (React StrictMode) ---
  const [initialized, setInitialized] = useState(false);

  // Cargas iniciales
  useEffect(() => {
    if (initialized) return; // evita doble ejecución en dev
    setInitialized(true);

    loadProducts();
    loadOrders();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await adminListProducts(token);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await adminListOrders(token);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminListUsers(token);
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeTab = (newTab) => {
    setTab(newTab);
    setError("");
    setCreateMessage("");
    setCreateUserMessage("");
    setEditUserMessage("");
  };

  // --- HANDLERS PRODUCTOS ---
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await adminDeleteProduct(id, token);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError("Error al eliminar producto");
    }
  };

  const handleCreateFiles = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    createPreviews.forEach((url) => URL.revokeObjectURL(url));
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setCreateImages(files);
    setCreatePreviews(newPreviews);
    setCreatePrimaryIndex(0);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreateMessage("");

    if (!createName || !createPrice || !createStock) {
      setCreateMessage("❌ Faltan campos obligatorios");
      return;
    }

    try {
      setCreateMessage("⏳ Subiendo imágenes...");
      let uploadedImages = [];

      if (createImages.length > 0) {
        let orderedFiles = [...createImages];
        if (createPrimaryIndex > 0 && createPrimaryIndex < orderedFiles.length) {
          const [selected] = orderedFiles.splice(createPrimaryIndex, 1);
          orderedFiles.unshift(selected);
        }

        const results = await Promise.all(orderedFiles.map((f) => uploadImage(f)));
        uploadedImages = results.flat();
      }

      setCreateMessage("⏳ Creando producto...");
      const payload = {
        name: createName,
        price: parseFloat(createPrice),
        stock: parseInt(createStock, 10),
        genero: createGenero,
        descripcion: createDescripcion,
        image: uploadedImages,
      };

      await createProduct(payload, token);
      setCreateMessage("✅ Producto creado con éxito");

      setCreateName("");
      setCreatePrice("");
      setCreateStock("");
      setCreateGenero("");
      setCreateDescripcion("");
      setCreateImages([]);
      setCreatePreviews([]);
      setCreatePrimaryIndex(0);

      await loadProducts();
      setTimeout(() => {
        setCreateMessage("");
        setIsCreating(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setCreateMessage("❌ Error al crear producto");
    }
  };

  // --- HANDLERS ÓRDENES ---
  const handleOrderStatus = async (order, status) => {
    const action = status === "enviado" ? "enviar" : "cancelar";
    if (!window.confirm(`¿Seguro que deseas ${action} esta orden?`)) return;

    try {
      if (status === "enviado") {
        if (!user) throw new Error("No hay admin en sesión");
        await confirmOrder(order.id, token, user.id); // baja stock + marca enviado
      } else if (status === "cancelado") {
        await rejectOrder(order.id, token); // devuelve stock + marca cancelado
      }

      await loadOrders();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar orden");
    }
  };

  // --- HANDLERS USUARIOS EXISTENTES ---
  const handleToggleUser = async (u) => {
    try {
      // ahora solo le pasamos el id al endpoint
      await adminSetUserBlocked(u.id, !u.blocked, token);

      setUsers((prev) =>
        prev.map((userItem) =>
          userItem.id === u.id
            ? { ...userItem, blocked: !userItem.blocked }
            : userItem
        )
      );
    } catch (err) {
      console.error(err);
      setError("Error al bloquear/desbloquear usuario");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Eliminar usuario permanentemente?")) return;
    try {
      await adminDeleteUser(id, token);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setError("Error al eliminar usuario");
    }
  };

  // --- CREAR USUARIO ---
  const handleNewUserChange = (field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserMessage("");

    if (!newUser.email || !newUser.password) {
      setCreateUserMessage("❌ Email y contraseña son obligatorios");
      return;
    }

    try {
      setCreateUserMessage("⏳ Creando usuario...");
      await adminCreateUser(newUser, token);
      setCreateUserMessage("✅ Usuario creado correctamente");

      await loadUsers();

      setNewUser({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        shipping_address: "",
        role: "cliente",
      });

      setTimeout(() => {
        setCreateUserMessage("");
        setShowCreateUser(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setCreateUserMessage("❌ Error al crear usuario");
    }
  };

  // --- EDITAR USUARIO ---
  const openEditUser = (u) => {
    setEditingUser(u);
    setEditUser({
      email: u.email || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      phone: u.phone || "",
      shipping_address: u.shipping_address || "",
      role: u.role || "cliente",
    });
    setEditUserMessage("");
  };

  const handleEditUserChange = (field, value) => {
    setEditUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditUserMessage("");

    try {
      setEditUserMessage("⏳ Guardando cambios...");

      await adminUpdateUser(editingUser.id, editUser, token);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                email: editUser.email,
                first_name: editUser.first_name,
                last_name: editUser.last_name,
                phone: editUser.phone,
                shipping_address: editUser.shipping_address,
                role: editUser.role,
              }
            : u
        )
      );

      setEditUserMessage("✅ Usuario actualizado");

      setTimeout(() => {
        setEditingUser(null);
        setEditUserMessage("");
      }, 1000);
    } catch (err) {
      console.error(err);
      setEditUserMessage("❌ Error al actualizar usuario");
    }
  };

  // --- CÁLCULOS / FILTROS ---
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    (u.first_name + " " + u.last_name + " " + u.email)
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );

  const totalProducts = products.length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
  const totalUsers = users.length;

  const pendingOrders = orders.filter((o) => o.status === "pendiente");
  const historyOrders = orders.filter((o) => o.status !== "pendiente");
  const pendingCount = pendingOrders.length;

  const sentOrders = orders.filter((o) => o.status === "enviado").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelado").length;

  const totalIncome = orders
    .filter((o) => o.status === "enviado")
    .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

  const inputStyle = {
    padding: "0.6rem 0.8rem",
    background: "rgba(255,146,52,0.08)",
    border: "1px solid rgba(255,146,52,0.4)",
    borderRadius: "0.6rem",
    color: "#fff",
    fontSize: "0.9rem",
  };

  return (
    <div className="admin-dashboard">
      {/* HEADER SUPERIOR */}
      <header className="admin-header">
        <div className="admin-header-content container">
          <h1 className="admin-title">⚡ Panel de Administración</h1>
        </div>
      </header>

      {/* NAVEGACIÓN TABS */}
      <div className="admin-tabs-container">
        <button
          className={`admin-tab-btn ${tab === "dashboard" ? "active" : ""}`}
          onClick={() => changeTab("dashboard")}
        >
          📊 DASHBOARD
        </button>
        <button
          className={`admin-tab-btn ${tab === "ordenes" ? "active" : ""}`}
          onClick={() => changeTab("ordenes")}
        >
          ⏳ ÓRDENES
        </button>
        <button
          className={`admin-tab-btn ${tab === "productos" ? "active" : ""}`}
          onClick={() => changeTab("productos")}
        >
          📦 PRODUCTOS
        </button>
        <button
          className={`admin-tab-btn ${tab === "usuarios" ? "active" : ""}`}
          onClick={() => changeTab("usuarios")}
        >
          👥 USUARIOS
        </button>
        <button
          className={`admin-tab-btn ${tab === "historial" ? "active" : ""}`}
          onClick={() => changeTab("historial")}
        >
          📋 HISTORIAL
        </button>
      </div>

      <div className="container" style={{ marginBottom: "2rem" }}>
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-sm-6">
                <div className="admin-stat-card gamer-card">
                  <div className="admin-stat-icon animated-icon">📦</div>
                  <div className="admin-stat-label">Productos</div>
                  <div className="admin-stat-value pulse-text">
                    {totalProducts}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "rgba(255,100,100,0.8)",
                      marginTop: "0.5rem",
                    }}
                  >
                    {outOfStockProducts > 0 &&
                      `⚠️ ${outOfStockProducts} sin stock`}
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="admin-stat-card gamer-card">
                  <div className="admin-stat-icon animated-icon">👥</div>
                  <div className="admin-stat-label">Usuarios</div>
                  <div className="admin-stat-value pulse-text">
                    {totalUsers}
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div
                  className={`admin-stat-card gamer-card ${
                    pendingCount > 0 ? "pending" : ""
                  }`}
                  style={{
                    borderColor:
                      pendingCount > 0
                        ? "#ff6b6b"
                        : "rgba(255,146,52,0.3)",
                  }}
                >
                  <div
                    className="admin-stat-icon animated-icon"
                    style={{
                      animation:
                        pendingCount > 0
                          ? "pulse 1.5s ease-in-out infinite"
                          : "float 3s ease-in-out infinite",
                    }}
                  >
                    🔔
                  </div>
                  <div className="admin-stat-label">Pendientes</div>
                  <div
                    className="admin-stat-value pulse-text"
                    style={{
                      color: pendingCount > 0 ? "#ff6b6b" : "#ff9f43",
                    }}
                  >
                    {pendingCount}
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6">
                <div className="admin-stat-card gamer-card">
                  <div className="admin-stat-icon animated-icon">💰</div>
                  <div className="admin-stat-label">Ingresos</div>
                  <div
                    className="admin-stat-value pulse-text neon-glow"
                    style={{ fontSize: "1.4rem" }}
                  >
                    ${totalIncome.toLocaleString("es-CL")}
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div
                  className="admin-stat-card"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(82, 196, 26, 0.15) 0%, rgba(57, 158, 13, 0.1) 100%)",
                    borderColor: "rgba(82, 196, 26, 0.3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2rem",
                      color: "#52c41a",
                      marginBottom: "0.5rem",
                    }}
                  >
                    ✅
                  </div>
                  <div className="admin-stat-label">Órdenes Enviadas</div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      color: "#52c41a",
                      fontWeight: 900,
                    }}
                  >
                    {sentOrders}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div
                  className="admin-stat-card"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255, 77, 79, 0.15) 0%, rgba(217, 54, 62, 0.1) 100%)",
                    borderColor: "rgba(255, 77, 79, 0.3)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2rem",
                      color: "#ff4d4f",
                      marginBottom: "0.5rem",
                    }}
                  >
                    ❌
                  </div>
                  <div className="admin-stat-label">Órdenes Canceladas</div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      color: "#ff4d4f",
                      fontWeight: 900,
                    }}
                  >
                    {cancelledOrders}
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="admin-stat-card">
                  <div
                    style={{
                      fontSize: "2rem",
                      color: "#ffc857",
                      marginBottom: "0.5rem",
                    }}
                  >
                    📊
                  </div>
                  <div className="admin-stat-label">Total de Órdenes</div>
                  <div
                    style={{
                      fontSize: "1.8rem",
                      color: "#ff9f43",
                      fontWeight: 900,
                    }}
                  >
                    {orders.length}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ALERTAS */}
        {loading && (
          <div className="admin-alert loading">⏳ Cargando información…</div>
        )}
        {error && <div className="admin-alert error">❌ {error}</div>}

        {/* TAB ÓRDENES */}
        {tab === "ordenes" && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h2>
                ⏳ Órdenes Pendientes{" "}
                {pendingCount > 0 && `(${pendingCount})`}
              </h2>
              <button
                onClick={loadOrders}
                className="admin-btn admin-btn-refresh"
              >
                🔄 Recargar
              </button>
            </div>

            {pendingOrders.length > 0 ? (
              <div className="admin-table-content">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Total</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="row-id">#{o.id}</td>
                        <td>{o.user_id}</td>
                        <td className="row-total">
                          ${Number(o.total || 0).toLocaleString("es-CL")}
                        </td>
                        <td>{formatDate(o.created_at)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleOrderStatus(o, "enviado")}
                            className="admin-btn admin-btn-success"
                          >
                            ✅ Enviar
                          </button>
                          <button
                            onClick={() =>
                              handleOrderStatus(o, "cancelado")
                            }
                            className="admin-btn admin-btn-danger"
                          >
                            ❌ Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                ✨ No hay órdenes pendientes
              </div>
            )}
          </div>
        )}

        {/* TAB PRODUCTOS */}
        {tab === "productos" && (
          <>
            {!isCreating ? (
              <div className="admin-table-container">
                <div className="admin-table-header">
                  <h2>📦 Productos</h2>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flex: "1 1 auto",
                      minWidth: "250px",
                      maxWidth: "600px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="admin-btn admin-btn-success"
                      onClick={() => setIsCreating(true)}
                    >
                      ➕ Subir nuevo producto
                    </button>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={productSearch}
                      onChange={(e) =>
                        setProductSearch(e.target.value)
                      }
                      className="admin-search-input"
                    />
                    <button
                      onClick={loadProducts}
                      className="admin-btn admin-btn-refresh"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                {filteredProducts.length > 0 ? (
                  <div className="admin-table-content">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Nombre</th>
                          <th>Género</th>
                          <th>Precio</th>
                          <th>Stock</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td className="row-id">#{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.genero || "—"}</td>
                            <td className="row-price">
                              ${Number(p.price || 0).toLocaleString("es-CL")}
                            </td>
                            <td
                              className={`row-stock ${
                                p.stock === 0
                                  ? "stock-zero"
                                  : "stock-available"
                              }`}
                            >
                              {p.stock}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                onClick={() =>
                                  handleDeleteProduct(p.id)
                                }
                                className="admin-btn admin-btn-danger"
                              >
                                🗑️ Eliminar
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setEditName(p.name || "");
                                  setEditPrice(String(p.price || ""));
                                  setEditStock(String(p.stock || ""));
                                  setEditGenero(p.genero || "");
                                  setEditDescripcion(
                                    p.descripcion || ""
                                  );
                                  setEditImages([]);
                                  const images = Array.isArray(p.image)
                                    ? p.image
                                    : p.image
                                    ? [p.image]
                                    : [];
                                  setEditCurrentImages(images);
                                  const previews = getImageUrls(p);
                                  setEditPreviews(previews);
                                  setEditPrimaryIndex(0);
                                }}
                                className="admin-btn admin-btn-primary"
                                style={{ marginLeft: "0.5rem" }}
                              >
                                ✏️ Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    No se encontraron productos
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,146,52,0.08) 0%, transparent 100%)",
                  padding: "2rem 1.5rem",
                  borderRadius: "0.8rem",
                  border: "1px solid rgba(255,146,52,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <h2
                    style={{
                      color: "#ff9f43",
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    🛍️ Subir Nuevo Producto
                  </h2>
                  <button
                    className="admin-btn"
                    onClick={() => setIsCreating(false)}
                  >
                    🔙 Volver a la lista
                  </button>
                </div>

                {createMessage && (
                  <div
                    className={`admin-alert ${
                      createMessage.includes("✅") ? "loading" : "error"
                    }`}
                    style={{ marginBottom: "1.5rem" }}
                  >
                    {createMessage}
                  </div>
                )}

                <form
                  onSubmit={handleCreateProduct}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "1.5rem",
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <input
                      placeholder="Nombre del producto"
                      value={createName}
                      onChange={(e) =>
                        setCreateName(e.target.value)
                      }
                      style={inputStyle}
                      required
                    />

                    <input
                      type="number"
                      placeholder="Precio"
                      value={createPrice}
                      onChange={(e) =>
                        setCreatePrice(e.target.value)
                      }
                      style={inputStyle}
                      required
                    />

                    <input
                      type="number"
                      placeholder="Stock"
                      value={createStock}
                      onChange={(e) =>
                        setCreateStock(e.target.value)
                      }
                      style={inputStyle}
                      required
                    />

                    <input
                      placeholder="Género / Categoría"
                      value={createGenero}
                      onChange={(e) =>
                        setCreateGenero(e.target.value)
                      }
                      style={inputStyle}
                    />

                    <textarea
                      placeholder="Descripción del producto"
                      value={createDescripcion}
                      onChange={(e) =>
                        setCreateDescripcion(e.target.value)
                      }
                      style={{ ...inputStyle, minHeight: "6rem" }}
                    />

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleCreateFiles}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    {createPreviews && createPreviews.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <p
                          style={{
                            color: "#ffc857",
                            fontWeight: 700,
                            marginBottom: "0.5rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          📸 Vista previa (Haz click para establecer
                          portada)
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {createPreviews.map((p, idx) => (
                            <div
                              key={p}
                              style={{
                                position: "relative",
                                width: "48%",
                              }}
                            >
                              <img
                                src={p}
                                alt={`Preview ${idx + 1}`}
                                onClick={() =>
                                  setCreatePrimaryIndex(idx)
                                }
                                style={{
                                  width: "100%",
                                  height: "8rem",
                                  objectFit: "cover",
                                  borderRadius: "0.5rem",
                                  border:
                                    idx === createPrimaryIndex
                                      ? "2px solid #ffc857"
                                      : "1px solid rgba(255,146,52,0.3)",
                                  boxShadow:
                                    idx === createPrimaryIndex
                                      ? "0 4px 12px rgba(255,146,52,0.3)"
                                      : "none",
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                title={
                                  idx === createPrimaryIndex
                                    ? "Portada seleccionada"
                                    : "Hacer portada"
                                }
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  background:
                                    idx === createPrimaryIndex
                                      ? "#ffc857"
                                      : "rgba(0,0,0,0.5)",
                                  color:
                                    idx === createPrimaryIndex
                                      ? "#000"
                                      : "#fff",
                                  padding: "4px 6px",
                                  borderRadius: 6,
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                {idx === createPrimaryIndex
                                  ? "Portada"
                                  : "Click"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    style={{
                      gridColumn: "1 / -1",
                      background:
                        "linear-gradient(135deg, #ff9f43 0%, #ff7e1d 100%)",
                      color: "#000",
                      border: "none",
                      padding: "1rem",
                      borderRadius: "0.6rem",
                      fontWeight: 700,
                      fontSize: "1rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    🚀 Subir Producto
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* TAB USUARIOS */}
        {tab === "usuarios" && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h2>👥 Usuarios</h2>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flex: "1 1 auto",
                  minWidth: "250px",
                  maxWidth: "500px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="admin-btn admin-btn-success"
                  type="button"
                  onClick={() =>
                    setShowCreateUser((prev) => !prev)
                  }
                >
                  ➕ Crear usuario
                </button>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={userSearch}
                  onChange={(e) =>
                    setUserSearch(e.target.value)
                  }
                  className="admin-search-input"
                />
                <button
                  onClick={loadUsers}
                  className="admin-btn admin-btn-refresh"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* FORMULARIO CREAR USUARIO */}
            {showCreateUser && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  borderRadius: "0.7rem",
                  border: "1px solid rgba(255,146,52,0.3)",
                  background:
                    "linear-gradient(135deg, rgba(255,146,52,0.08) 0%, transparent 100%)",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "0.8rem",
                    color: "#ffc857",
                  }}
                >
                  ➕ Crear nuevo usuario
                </h3>

                {createUserMessage && (
                  <div
                    className={`admin-alert ${
                      createUserMessage.includes("✅")
                        ? "loading"
                        : "error"
                    }`}
                    style={{ marginBottom: "0.8rem" }}
                  >
                    {createUserMessage}
                  </div>
                )}

                <form
                  onSubmit={handleCreateUser}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",
                    gap: "0.6rem",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="email"
                    placeholder="Correo"
                    value={newUser.email}
                    onChange={(e) =>
                      handleNewUserChange("email", e.target.value)
                    }
                    required
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={newUser.password}
                    onChange={(e) =>
                      handleNewUserChange(
                        "password",
                        e.target.value
                      )
                    }
                    required
                    style={inputStyle}
                  />
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      handleNewUserChange("role", e.target.value)
                    }
                    style={inputStyle}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>

                  <input
                    placeholder="Nombre"
                    value={newUser.first_name}
                    onChange={(e) =>
                      handleNewUserChange(
                        "first_name",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                  <input
                    placeholder="Apellido"
                    value={newUser.last_name}
                    onChange={(e) =>
                      handleNewUserChange(
                        "last_name",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                  <input
                    placeholder="Teléfono"
                    value={newUser.phone}
                    onChange={(e) =>
                      handleNewUserChange("phone", e.target.value)
                    }
                    style={inputStyle}
                  />

                  <input
                    placeholder="Dirección"
                    value={newUser.shipping_address}
                    onChange={(e) =>
                      handleNewUserChange(
                        "shipping_address",
                        e.target.value
                      )
                    }
                    style={{ ...inputStyle, gridColumn: "1 / 3" }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => {
                        setShowCreateUser(false);
                        setCreateUserMessage("");
                      }}
                    >
                      ✖ Cancelar
                    </button>
                    <button
                      type="submit"
                      className="admin-btn admin-btn-success"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {filteredUsers.length > 0 ? (
              <div className="admin-table-content">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="row-id">#{u.id}</td>
                        <td>
                          {u.first_name} {u.last_name}
                        </td>
                        <td style={{ fontSize: "0.9rem" }}>
                          {u.email}
                        </td>
                        <td
                          style={{
                            color:
                              u.role === "admin"
                                ? "#ffc857"
                                : "rgba(255,255,255,0.8)",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {u.role || "cliente"}
                        </td>
                        <td
                          style={{
                            color: u.blocked
                              ? "#ff6b6b"
                              : "#52c41a",
                            fontWeight: 600,
                          }}
                        >
                          {u.blocked ? "🔒" : "✅"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => openEditUser(u)}
                            className="admin-btn admin-btn-primary"
                            style={{
                              marginRight: "0.4rem",
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleUser(u)}
                            className={`admin-btn ${
                              u.blocked
                                ? "admin-btn-success"
                                : "admin-btn-warning"
                            }`}
                          >
                            {u.blocked ? "🔓" : "🔒"}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="admin-btn admin-btn-danger"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                No se encontraron usuarios
              </div>
            )}
          </div>
        )}

        {/* TAB HISTORIAL */}
        {tab === "historial" && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h2>📋 Historial</h2>
              <button
                onClick={loadOrders}
                className="admin-btn admin-btn-refresh"
              >
                🔄 Recargar
              </button>
            </div>

            {historyOrders.length > 0 ? (
              <div className="admin-table-content">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="row-id">#{o.id}</td>
                        <td>{o.user_id}</td>
                        <td className="row-total">
                          ${Number(o.total || 0).toLocaleString("es-CL")}
                        </td>
                        <td className={`row-status status-${o.status}`}>
                          {o.status}
                        </td>
                        <td>{formatDate(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                No hay órdenes en el historial
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL EDITAR PRODUCTO */}
      {editingProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Editar producto #{editingProduct.id}</h3>
            {error && (
              <div
                className="admin-alert error"
                style={{ marginBottom: "1rem" }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError("");
                try {
                  let uploaded = [];
                  if (editImages && editImages.length > 0) {
                    let orderedFiles = [...editImages];
                    if (
                      editPrimaryIndex > 0 &&
                      editPrimaryIndex < orderedFiles.length
                    ) {
                      const [selected] = orderedFiles.splice(
                        editPrimaryIndex,
                        1
                      );
                      orderedFiles.unshift(selected);
                    }
                    const results = await Promise.all(
                      orderedFiles.map((f) => uploadImage(f))
                    );
                    uploaded = results.flat();
                  } else if (
                    editCurrentImages &&
                    editCurrentImages.length > 0
                  ) {
                    let orderedImages = [...editCurrentImages];
                    if (
                      editPrimaryIndex > 0 &&
                      editPrimaryIndex < orderedImages.length
                    ) {
                      const [selected] = orderedImages.splice(
                        editPrimaryIndex,
                        1
                      );
                      orderedImages.unshift(selected);
                    }
                    uploaded = orderedImages;
                  }

                  const payload = {
                    name: editName,
                    price: parseFloat(editPrice) || 0,
                    stock: parseInt(editStock, 10) || 0,
                    genero: editGenero,
                    descripcion: editDescripcion,
                  };

                  if (uploaded.length) {
                    payload.image = uploaded;
                  }

                  await adminUpdateProduct(
                    editingProduct.id,
                    payload,
                    token
                  );
                  const data = await adminListProducts(token);
                  if (data) setProducts(data);
                  setEditingProduct(null);
                } catch (err) {
                  console.error(err);
                  setError("No se pudo actualizar el producto.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="admin-form-row">
                <label>Nombre</label>
                <input
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div className="admin-form-row">
                <label>Precio</label>
                <input
                  value={editPrice}
                  onChange={(e) =>
                    setEditPrice(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div className="admin-form-row">
                <label>Stock</label>
                <input
                  value={editStock}
                  onChange={(e) =>
                    setEditStock(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div className="admin-form-row">
                <label>Género</label>
                <input
                  value={editGenero}
                  onChange={(e) =>
                    setEditGenero(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div className="admin-form-row">
                <label>Descripción</label>
                <textarea
                  value={editDescripcion}
                  onChange={(e) =>
                    setEditDescripcion(e.target.value)
                  }
                  style={{ ...inputStyle, minHeight: "80px" }}
                />
              </div>
              <div className="admin-form-row">
                <label>Imágenes (subir nuevas para reemplazar)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files
                      ? Array.from(e.target.files)
                      : [];
                    editPreviews.forEach((p) =>
                      URL.revokeObjectURL(p)
                    );
                    const urls = files.map((f) =>
                      URL.createObjectURL(f)
                    );
                    setEditImages(files);
                    setEditPreviews(urls);
                    setEditCurrentImages([]);
                    setEditPrimaryIndex(0);
                  }}
                  style={inputStyle}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {editPreviews.map((u, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: "100px",
                        cursor: "pointer",
                      }}
                      onClick={() => setEditPrimaryIndex(idx)}
                    >
                      <img
                        src={u}
                        alt="preview"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                          border:
                            idx === editPrimaryIndex
                              ? "2px solid #ffc857"
                              : "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          background:
                            idx === editPrimaryIndex
                              ? "#ffc857"
                              : "rgba(0,0,0,0.5)",
                          color:
                            idx === editPrimaryIndex
                              ? "#000"
                              : "#fff",
                          padding: "2px 4px",
                          borderRadius: 4,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                        }}
                      >
                        {idx === editPrimaryIndex ? "Portada" : "Click"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-success"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {editingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Editar usuario #{editingUser.id}</h3>

            {editUserMessage && (
              <div
                className={`admin-alert ${
                  editUserMessage.includes("✅")
                    ? "loading"
                    : "error"
                }`}
                style={{ marginBottom: "0.8rem" }}
              >
                {editUserMessage}
              </div>
            )}

            <form onSubmit={handleUpdateUser}>
              <div className="admin-form-row">
                <label>Correo</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) =>
                    handleEditUserChange("email", e.target.value)
                  }
                  required
                  style={inputStyle}
                />
              </div>

              <div className="admin-form-row">
                <label>Nombre</label>
                <input
                  value={editUser.first_name}
                  onChange={(e) =>
                    handleEditUserChange(
                      "first_name",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div className="admin-form-row">
                <label>Apellido</label>
                <input
                  value={editUser.last_name}
                  onChange={(e) =>
                    handleEditUserChange(
                      "last_name",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div className="admin-form-row">
                <label>Teléfono</label>
                <input
                  value={editUser.phone}
                  onChange={(e) =>
                    handleEditUserChange("phone", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div className="admin-form-row">
                <label>Dirección</label>
                <input
                  value={editUser.shipping_address}
                  onChange={(e) =>
                    handleEditUserChange(
                      "shipping_address",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div className="admin-form-row">
                <label>Rol</label>
                <select
                  value={editUser.role}
                  onChange={(e) =>
                    handleEditUserChange("role", e.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="cliente">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => {
                    setEditingUser(null);
                    setEditUserMessage("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-success"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
