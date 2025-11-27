// src/App.jsx
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { CartProvider, useCart } from "./context/CartContext.jsx";

import logo from "../img/logo.png";
import iconSayan from "../img/icon_sayan.png";
import iconBase from "../img/icon_base.png";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Logout from "./pages/Logout.jsx";
import CreateProduct from "./pages/CreateProduct.jsx";
import Cart from "./pages/Cart.jsx";
import Footer from "./components/Footer.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Checkout from "./pages/Checkout.jsx";
import Blog from "./pages/Blog.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import AdminBlog from "./pages/AdminBlog.jsx";
import AdminBlogEdit from "./pages/AdminBlogEdit.jsx"; // 👈 NUEVO IMPORT

function getRoleFromUser(user) {
  if (!user) return "";

  if (typeof user.role === "string" && user.role.trim() !== "")
    return user.role.toLowerCase();

  if (user.role && typeof user.role === "object") {
    if (typeof user.role.name === "string") return user.role.name.toLowerCase();
    if (user.role.id === 1) return "admin";
    if (user.role.id === 2) return "cliente";
  }

  if (user.role_id != null) {
    const id = Number(user.role_id);
    if (id === 1) return "admin";
    if (id === 2) return "cliente";
  }

  return "";
}

function PrivateRoute({ children, allowRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = getRoleFromUser(user);

  if (allowRoles && role && !allowRoles.includes(role))
    return <Navigate to="/home" replace />;

  return children;
}

function CartButton({ onNavClick }) {
  try {
    const { count } = useCart();

    return (
      <Link
        to="/cart"
        className="btn fw-bold position-relative kame-cart-btn d-flex align-items-center"
        aria-label="Ver carrito"
        title="Ver carrito de compras"
        onClick={onNavClick}
      >
        {count === 0 ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
            className="me-2"
          >
            <path
              d="M7 4H5l-1 2H2v2h2l3.6 7.59-1.35 2.45C5.89 18.37 6.48 20 8 20h11v-2H8.42c-.14 0-.25-.11-.25-.25l.03-.12L9.1 16h7.45c.75 0 1.41-.41 1.75-1.03L21.9 8.48 20.15 7.47 18.42 12H9.1L7 6h12V4H7z"
              fill="currentColor"
            />
            <circle cx="10" cy="21" r="1.5" fill="currentColor" />
            <circle cx="18" cy="21" r="1.5" fill="currentColor" />
          </svg>
        ) : (
          <span className="kame-cart-count me-2">{count}</span>
        )}
        <span>Carrito</span>
      </Link>
    );
  } catch {
    return (
      <Link
        to="/cart"
        className="btn fw-bold kame-cart-btn d-flex align-items-center"
        onClick={onNavClick}
      >
        Carrito
      </Link>
    );
  }
}

export default function App() {
  const { user } = useAuth();
  const role = getRoleFromUser(user);
  const isAdmin = role === "admin";

  // 👉 Cerrar menú móvil al hacer clic en cualquier opción
  const handleNavClick = () => {
    const nav = document.getElementById("kameNavbarContent");
    const toggler = document.querySelector(".kame-navbar .navbar-toggler");

    if (nav && nav.classList.contains("show")) {
      nav.classList.remove("show");
      nav.classList.add("collapse");
    }
    if (toggler) {
      toggler.setAttribute("aria-expanded", "false");
    }
  };

  return (
    <CartProvider>
      <div className="container-fluid p-0 kame-app-root d-flex flex-column">
        {/* NAVBAR */}
        <nav className="navbar navbar-expand-lg shadow-sm navbar-compact kame-navbar">
          <div className="container-fluid align-items-center">
            {/* BRAND */}
            <Link
              to="/home"
              className="navbar-brand d-flex align-items-center gap-2 fw-bold text-white"
              onClick={handleNavClick}
            >
              <img src={logo} alt="KameHouse logo" className="logo me-2" />
              <span
                className="kame-brand-name"
                style={{ letterSpacing: "0.1em" }}
              >
                KameHouse
              </span>
              <small
                className="text-white-50 ms-2"
                style={{ fontSize: 12 }}
              >
                Videojuegos
              </small>
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#kameNavbarContent"
              aria-controls="kameNavbarContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="kameNavbarContent">
              {/* 👇 kame-nav-actions para el layout móvil */}
              <div className="d-flex align-items-center ms-auto gap-2 kame-nav-actions">
                {/* CLIENTE */}
                {!isAdmin && (
                  <>
                    <Link
                      to="/home"
                      className="btn btn-light fw-bold me-2 kame-btn-light"
                      onClick={handleNavClick}
                    >
                      Inicio
                    </Link>

                    <Link
                      to="/blog"
                      className="nav-link fw-bold text-white me-2"
                      onClick={handleNavClick}
                    >
                      Blog
                    </Link>
                  </>
                )}

                {/* ADMIN */}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="btn btn-outline-warning fw-bold me-2"
                      onClick={handleNavClick}
                    >
                      Panel admin
                    </Link>

                      <Link
                        to="/admin/blog"
                        className="btn btn-warning fw-bold me-2"
                        title="Administrar blog"
                        onClick={handleNavClick}
                      >
                        Blog admin
                      </Link>
                  </>
                )}

                {/* PERFIL */}
                {user && (
                  <Link
                    to="/perfil"
                    className="nav-link fw-bold text-white me-2"
                    onClick={handleNavClick}
                  >
                    <img
                      src={isAdmin ? iconSayan : iconBase}
                      alt="Perfil"
                      style={{
                        width: "45px",
                        height: "45px",
                        objectFit: "contain",
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                  </Link>
                )}

                {/* LOGIN / REGISTER */}
                {!user && (
                  <>
                    <Link
                      to="/login"
                      className="nav-link fw-bold text-white me-2"
                      onClick={handleNavClick}
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      className="nav-link fw-bold text-white me-2"
                      onClick={handleNavClick}
                    >
                      Registrarse
                    </Link>
                  </>
                )}

                {/* CARRITO SOLO CLIENTE */}
                {!isAdmin && <CartButton onNavClick={handleNavClick} />}
              </div>
            </div>
          </div>
        </nav>

        {/* RUTAS */}
        <main className="kame-main flex-grow-1">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route
              path="/home"
              element={isAdmin ? <Navigate to="/admin" replace /> : <Home />}
            />

            <Route
              path="/blog"
              element={isAdmin ? <Navigate to="/admin" replace /> : <Blog />}
            />
            <Route path="/blog/:id" element={<BlogPost />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/logout"
              element={
                <PrivateRoute allowRoles={["cliente", "admin"]}>
                  <Logout />
                </PrivateRoute>
              }
            />

            <Route
              path="/perfil"
              element={
                <PrivateRoute allowRoles={["cliente", "admin"]}>
                  <UserProfile />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <PrivateRoute allowRoles={["admin"]}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/blog"
              element={
                <PrivateRoute allowRoles={["admin"]}>
                  <AdminBlog />
                </PrivateRoute>
              }
            />

            {/* Ruta de edición del blog */}
            <Route
              path="/admin/blog/edit/:id"
              element={
                <PrivateRoute allowRoles={["admin"]}>
                  <AdminBlogEdit />
                </PrivateRoute>
              }
            />

            <Route
              path="/crear-productos"
              element={
                <PrivateRoute allowRoles={["admin"]}>
                  <CreateProduct />
                </PrivateRoute>
              }
            />

            <Route
              path="/cart"
              element={
                <PrivateRoute allowRoles={["cliente", "admin"]}>
                  {isAdmin ? <Navigate to="/admin" replace /> : <Cart />}
                </PrivateRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <PrivateRoute allowRoles={["cliente", "admin"]}>
                  {isAdmin ? <Navigate to="/admin" replace /> : <Checkout />}
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}
