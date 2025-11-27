// src/components/ProductGrid.jsx
import { useEffect, useState, useMemo } from "react";
import { listProducts } from "../api/xano";
import { useCart } from "../context/CartContext.jsx";

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

// --- Función para obtener URLs de imágenes desde Xano ---
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

export default function ProductGrid({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const { addToCart, cart } = useCart();

  const LIMIT = 50; // cuántos productos traer desde Xano
  const PAGE_SIZE = 8; // cuántos mostrar por página
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ====== estado para modal de detalle ======
  const [selected, setSelected] = useState(null); // { product, imgs }
  const [modalIdx, setModalIdx] = useState(0);
  const [modalQty, setModalQty] = useState(1);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setErr("");
      const data = await listProducts({ token, limit: LIMIT });
      console.log("📦 Productos obtenidos:", data);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error al cargar productos:", e);
      setErr("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  }

  // --- filtro de búsqueda en memoria ---
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((p) =>
      [p.name, p.genero, p.descripcion].some((f) =>
        String(f || "").toLowerCase().includes(needle)
      )
    );
  }, [items, q]);

  // reset de página cuando cambia la búsqueda o los datos
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, items]);

  // paginación
  const currentPage = Math.ceil(visibleCount / PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const visibleItems = filtered.slice(startIdx, endIdx);

  const handlePageClick = (page) => {
    const newVisibleCount = page * PAGE_SIZE;
    setVisibleCount(newVisibleCount);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ====== MODAL: bloquear scroll de fondo ======
  useEffect(() => {
    if (selected) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [selected]);

  const openModal = (product, imgs) => {
    setSelected({ product, imgs });
    setModalIdx(0);
    setModalQty(1);
  };

  const closeModal = () => {
    setSelected(null);
  };

  const nextImg = () => {
    if (!selected?.imgs?.length) return;
    setModalIdx((i) => (i + 1) % selected.imgs.length);
  };

  const prevImg = () => {
    if (!selected?.imgs?.length) return;
    setModalIdx((i) => (i - 1 + selected.imgs.length) % selected.imgs.length);
  };

  const handleAddFromModal = () => {
    if (!selected) return;
    const p = selected.product;
    const imgs = selected.imgs || [];
    addToCart(
      {
        id: p.id,
        name: p.name,
        price: p.price,
        image: imgs[0] || "",
        images: imgs,
        stock: Number(p.stock ?? 0),
      },
      modalQty
    );
  };

  return (
    <>
      <div className="container">
        {/* --- Barra superior catálogo + búsqueda --- */}
        <div className="d-flex align-items-center mb-3 gap-3 flex-wrap kame-catalog-header">
          <div className="kame-catalog-title-wrapper">
            <h2 className="m-0 kame-catalog-title">Catálogo KameHouse</h2>
          </div>

          <div className="d-flex align-items-center gap-2 kame-catalog-actions">
            <input
              placeholder="Buscar por nombre, género o descripción…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="form-control kame-catalog-search"
            />

            <button
              onClick={loadProducts}
              disabled={loading}
              className="btn kame-catalog-reload-btn fw-bold"
              type="button"
            >
              {loading ? "Cargando…" : "Recargar"}
            </button>
          </div>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        {/* --- Grilla de productos (custom grid, NO Bootstrap row) --- */}
        <div className="kame-product-grid">
          {visibleItems.map((p) => {
            const imgs = getImageUrls(p);
            const thumb = imgs[0] || "";

            // lo que ya está en el carrito
            const inCart = cart.find((c) => c.id === p.id);
            const qtyInCart = inCart?.quantity ?? 0;

            const stockTotal = Number(p.stock ?? 0);
            const stockLeft = Math.max(stockTotal - qtyInCart, 0);

            return (
              <div className="kame-product-card" key={p.id}>
                <div
                  className="card h-100 rounded-4 shadow-sm kame-card"
                  style={{
                    backgroundColor: "rgba(30,20,10,0.95)",
                    border: "1px solid rgba(255,146,52,0.15)",
                    filter:
                      stockLeft <= 0
                        ? "grayscale(100%) brightness(0.7)"
                        : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* 🔶 ZONA SUPERIOR: Imagen + título */}
                  <div
                    className="kame-card-top"
                    onClick={() => openModal(p, imgs)}
                  >
                    <div className="kame-card-img-wrap">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p.name}
                          className="kame-card-img"
                        />
                      ) : (
                        <div className="kame-card-img-empty">Sin imagen</div>
                      )}
                    </div>

                    <h5 className="kame-card-title">{p.name}</h5>
                  </div>

                  {/* 🟪 SEPARADOR INVISIBLE */}
                  <div className="kame-card-separator" />

                  {/* 🔶 ZONA INFERIOR: Género, precio, stock, botón */}
                  <div className="kame-card-bottom">
                    <div className="kame-card-genre">
                      {p.genero || "Género no especificado"}
                    </div>

                    <div className="kame-card-info-row">
                      <span className="kame-card-price">
                        {CLP.format(Number(p.price || 0))}
                      </span>

                      <span
                        className={
                          stockLeft > 0
                            ? "kame-card-stock-ok"
                            : "kame-card-stock-bad"
                        }
                      >
                        {stockLeft > 0 ? `Stock: ${stockLeft}` : "Agotado"}
                      </span>
                    </div>

                    <button
                      className={`btn fw-bold mt-auto kame-product-btn ${
                        inCart ? "btn-outline-light" : "btn-warning"
                      }`}
                      disabled={stockLeft <= 0}
                      onClick={() =>
                        addToCart(
                          {
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            image: thumb,
                            images: imgs,
                            stock: stockTotal,
                          },
                          1
                        )
                      }
                    >
                      {stockLeft <= 0
                        ? "Sin stock"
                        : inCart
                        ? `En carrito (${qtyInCart})`
                        : "Agregar al carrito"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- Paginación numérica --- */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`btn fw-bold ${
                  currentPage === page ? "btn-warning" : "btn-outline-warning"
                }`}
                onClick={() => handlePageClick(page)}
                style={{
                  minWidth: "40px",
                  minHeight: "40px",
                  padding: "0.5rem 0.75rem",
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ====== MODAL DETALLE PRODUCTO ====== */}
      {selected && (
        <div className="kame-modal-backdrop" onClick={closeModal}>
          <div className="kame-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="kame-modal-close"
              type="button"
              onClick={closeModal}
              aria-label="Cerrar"
            >
              ✕
            </button>

            <div className="kame-modal-content">
              {/* Columna imagen */}
              <div className="kame-modal-image-col">
                {selected.imgs && selected.imgs.length > 0 ? (
                  <div className="kame-modal-image-wrapper">
                    <img
                      src={selected.imgs[modalIdx]}
                      alt={selected.product.name}
                      className="kame-modal-image"
                    />
                    {selected.imgs.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="kame-modal-img-nav left"
                          onClick={prevImg}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="kame-modal-img-nav right"
                          onClick={nextImg}
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="kame-modal-noimage">Sin imagen</div>
                )}
              </div>

              {/* Columna info */}
              <div className="kame-modal-info-col">
                <h2 className="kame-modal-title">{selected.product.name}</h2>
                <div className="kame-modal-genre">
                  {selected.product.genero || "Género no especificado"}
                </div>

                {selected.product.descripcion && (
                  <p className="kame-modal-desc">
                    {selected.product.descripcion}
                  </p>
                )}

                {/* Precio / stock */}
                <div className="kame-modal-price-row">
                  <span className="kame-modal-price-label">Precio</span>
                  <span className="kame-modal-price-value">
                    {CLP.format(Number(selected.product.price || 0))}
                  </span>
                </div>

                {(() => {
                  const inCart = cart.find(
                    (c) => c.id === selected.product.id
                  );
                  const qtyInCart = inCart?.quantity ?? 0;
                  const stockTotal = Number(selected.product.stock ?? 0);
                  const stockLeft = Math.max(stockTotal - qtyInCart, 0);
                  return (
                    <>
                      <div className="kame-modal-stock-row">
                        <span className="kame-modal-price-label">Stock</span>
                        <span
                          className={
                            stockLeft > 0 ? "txt-stock-ok" : "txt-stock-bad"
                          }
                        >
                          {stockLeft > 0
                            ? `Disponible: ${stockLeft}`
                            : "Agotado"}
                        </span>
                      </div>
                      {qtyInCart > 0 && (
                        <div className="kame-modal-incart">
                          Ya tienes {qtyInCart} en tu carrito.
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Cantidad + botón */}
                {(() => {
                  const inCart = cart.find(
                    (c) => c.id === selected.product.id
                  );
                  const qtyInCart = inCart?.quantity ?? 0;
                  const stockTotal = Number(selected.product.stock ?? 0);
                  const stockLeft = Math.max(stockTotal - qtyInCart, 0);
                  const disabled = stockLeft <= 0;

                  const safeQty = Math.min(
                    Math.max(modalQty, 1),
                    Math.max(stockLeft, 1)
                  );

                  if (safeQty !== modalQty) {
                    setModalQty(safeQty);
                  }

                  return (
                    <div className="kame-modal-actions">
                      <div className="kame-modal-qty">
                        <button
                          type="button"
                          onClick={() =>
                            setModalQty((q) => Math.max(1, q - 1))
                          }
                          disabled={disabled}
                        >
                          –
                        </button>
                        <span>{safeQty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalQty((q) =>
                              Math.min(stockLeft || 1, q + 1)
                            )
                          }
                          disabled={disabled}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="kame-modal-add-btn"
                        onClick={handleAddFromModal}
                        disabled={disabled}
                      >
                        {disabled ? "Sin stock" : "Agregar al carrito"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
