// src/pages/Home.jsx
import React from "react";
import UserBar from "../components/UserBar.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import "./Home.css";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { token } = useAuth();

  return (
    <div className="container py-3">

      {/* Hero compacto: nombre de la tienda y descripción */}
      <div className="home-compact-hero text-center">
        <h1 className="home-compact-title">KameHouse</h1>
        <div className="home-compact-sep" aria-hidden />
        <p className="home-compact-desc">
          Tienda exclusiva de videojuegos — lanzamientos, indies y las mejores ofertas.
        </p>
      </div>

      {/* 🔥 UserBar centrado y más pequeño */}
      <div className="home-userbar-wrapper d-flex justify-content-center mt-3 mb-4">
        <div className="home-userbar-mini">
          <UserBar />
        </div>
      </div>

      <section className="home-section mb-5">
        <div className="section-title mb-3">
          <h2 className="h4 fw-bold">Juegos destacados</h2>
          <a href="/blog" className="kame-navbar-btn">Leer Noticias</a>
        </div>

        <div className="home-products">
          <ProductGrid token={token} />
        </div>
      </section>
    </div>
  );
}
