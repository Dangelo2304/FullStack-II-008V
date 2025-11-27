// src/pages/AdminBlog.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminListBlogPosts,
  adminDeleteBlogPost,
  toggleBlogPostPublished,
  adminCreateBlogPost,
  uploadImage,
} from "../api/xano.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminBlog.css";

const SECTION_LABELS = {
  news: "NOTICIAS",
  review: "RESEÑAS",
  curiosity: "CURIOSIDADES",
};

const formatDate = (ts) => {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getCoverUrl = (post) => {
  const img = post?.cover_image;
  if (!img) return null;

  if (typeof img === "string") {
    if (img.startsWith("/vault/") || img.startsWith("/")) {
      return `https://x8ki-letl-twmt.n7.xano.io${img}`;
    }
    return img;
  }

  if (img.url) return img.url;
  if (img.path) return `https://x8ki-letl-twmt.n7.xano.io${img.path}`;

  return null;
};

export default function AdminBlog() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all | published | draft

  // estado para CREAR NUEVA ENTRADA
  const [creating, setCreating] = useState(false);
  const [creatingSaving, setCreatingSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    section: "news",
    tag: "",
    excerpt: "",
    body: "",
    cover_image: null,
  });

  // cargar posts al entrar
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await adminListBlogPosts(token);
        setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando posts admin:", err);
        setError("No se pudieron cargar los posts del blog.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  // filtros en memoria
  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (posts || [])
      .slice()
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
      .filter((p) => {
        if (filterSection === "all") return true;
        if (!p.section) return false;
        return String(p.section).toLowerCase() === filterSection;
      })
      .filter((p) => {
        if (filterStatus === "all") return true;
        if (filterStatus === "published") return p.published === true;
        if (filterStatus === "draft") return p.published === false;
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        const haystack = `${p.title || ""} ${p.tag || ""} ${
          p.excerpt || ""
        }`.toLowerCase();
        return haystack.includes(q);
      });
  }, [posts, filterSection, filterStatus, search]);

  const handleTogglePublished = async (post) => {
    try {
      const newValue = !post.published;
      await toggleBlogPostPublished(post.id, newValue);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, published: newValue } : p
        )
      );
    } catch (err) {
      console.error("Error al cambiar published:", err);
      alert("No se pudo cambiar el estado de publicación.");
    }
  };

  const handleDelete = async (post) => {
    const ok = window.confirm(
      `¿Seguro que quieres eliminar el post "${post.title}"?`
    );
    if (!ok) return;

    try {
      await adminDeleteBlogPost(post.id, token);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      console.error("Error al eliminar post:", err);
      alert("No se pudo eliminar el post.");
    }
  };

  // ====== CREAR NUEVA ENTRADA ======

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadImage(file);
      setCreateForm((prev) => ({
        ...prev,
        cover_image: res[0],
      }));
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      alert("No se pudo subir la imagen.");
    }
  };

  const handleCreateSubmit = async () => {
    if (!createForm.title.trim()) {
      alert("El título es obligatorio.");
      return;
    }

    setCreatingSaving(true);

    try {
      const payload = {
        ...createForm,
        // si quieres que se cree como borrador, cambia a `published: false`
        published: true,
      };

      const nuevo = await adminCreateBlogPost(payload);

      // Lo agregamos al inicio de la lista
      setPosts((prev) => [nuevo, ...prev]);

      // Limpiar formulario y cerrar panel
      setCreateForm({
        title: "",
        section: "news",
        tag: "",
        excerpt: "",
        body: "",
        cover_image: null,
      });
      setCreating(false);
    } catch (err) {
      console.error("Error al crear post:", err);
      alert("No se pudo crear la nueva entrada.");
    } finally {
      setCreatingSaving(false);
    }
  };

  const handleCreateCancel = () => {
    setCreating(false);
  };

  return (
    <div className="admin-page">
      {/* CABECERA PANEL */}
      <section className="admin-hero">
        <h1 className="admin-hero-title">PANEL BLOG</h1>
        <p className="admin-hero-subtitle">
          Administra las entradas del blog KameHouse. Todo lo que publiques aquí
          aparece en el blog del cliente.
        </p>
      </section>

      {/* FILTROS Y BUSCADOR */}
      <section className="admin-toolbar">
        <div className="admin-toolbar-left">
          <button
            className="admin-primary-btn"
            type="button"
            onClick={() => setCreating(true)}
          >
            CREAR NUEVA ENTRADA
          </button>
        </div>

        <div className="admin-toolbar-right">
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="admin-select"
          >
            <option value="all">Todas las secciones</option>
            <option value="news">Noticias</option>
            <option value="review">Reseñas</option>
            <option value="curiosity">Curiosidades</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="admin-select"
          >
            <option value="all">Todos los estados</option>
            <option value="published">Publicado</option>
            <option value="draft">Borrador</option>
          </select>

          <input
            type="text"
            className="admin-search-input"
            placeholder="Buscar por título o tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* PANEL CREAR NUEVA ENTRADA */}
      {creating && (
        <section className="admin-create-panel">
          <h2 className="admin-create-title">Crear nueva entrada</h2>

          <div className="admin-create-form">
            <label className="admin-label">Título</label>
            <input
              className="admin-input"
              value={createForm.title}
              onChange={(e) => handleCreateChange("title", e.target.value)}
            />

            <label className="admin-label">Sección</label>
            <select
              className="admin-select"
              value={createForm.section}
              onChange={(e) => handleCreateChange("section", e.target.value)}
            >
              <option value="news">Noticias</option>
              <option value="review">Reseñas</option>
              <option value="curiosity">Curiosidades</option>
            </select>

            <label className="admin-label">Tag</label>
            <input
              className="admin-input"
              value={createForm.tag}
              onChange={(e) => handleCreateChange("tag", e.target.value)}
            />

            <label className="admin-label">Extracto</label>
            <textarea
              className="admin-textarea"
              value={createForm.excerpt}
              onChange={(e) => handleCreateChange("excerpt", e.target.value)}
            />

            <label className="admin-label">Contenido</label>
            <textarea
              className="admin-textarea big"
              value={createForm.body}
              onChange={(e) => handleCreateChange("body", e.target.value)}
            />

            {/* Portada actual */}
            {createForm.cover_image && (
              <img
                className="edit-cover-preview"
                src={
                  typeof createForm.cover_image === "string"
                    ? createForm.cover_image
                    : createForm.cover_image.url
                }
                alt="Portada"
              />
            )}

            <label className="admin-label">Portada</label>
            <input type="file" onChange={handleCreateFile} />

            <div className="edit-actions">
              <button
                type="button"
                className="admin-btn-outline"
                onClick={handleCreateCancel}
                disabled={creatingSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleCreateSubmit}
                disabled={creatingSaving}
              >
                {creatingSaving ? "Guardando..." : "Guardar entrada"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ESTADOS */}
      {loading && <p className="admin-state">Cargando posts del blog...</p>}
      {error && <p className="admin-state admin-state-error">{error}</p>}
      {!loading && !error && filteredPosts.length === 0 && (
        <p className="admin-state">No hay posts en la tabla blog_post.</p>
      )}

      {/* LISTA DE POSTS */}
      {!loading && !error && filteredPosts.length > 0 && (
        <section className="admin-blog-list">
          {filteredPosts.map((post) => {
            const coverUrl = getCoverUrl(post);
            const isPublished = post.published === true;

            return (
              <article key={post.id} className="admin-blog-card">
                {coverUrl && (
                  <div className="admin-blog-card-image">
                    <img src={coverUrl} alt={post.title} />
                  </div>
                )}

                <div className="admin-blog-card-body">
                  <div className="admin-blog-card-header">
                    <div>
                      <h2 className="admin-blog-card-title">{post.title}</h2>
                      <p className="admin-blog-card-meta">
                        {post.section && (
                          <span className="admin-badge">
                            {SECTION_LABELS[post.section] ||
                              String(post.section).toUpperCase()}
                          </span>
                        )}
                        {post.tag && (
                          <span className="admin-badge secondary">
                            #{post.tag}
                          </span>
                        )}
                        {post.created_at && (
                          <span className="admin-blog-card-date">
                            · {formatDate(post.created_at)}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={
                        "admin-status-pill " +
                        (isPublished ? "published" : "draft")
                      }
                    >
                      {isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>

                  {post.excerpt && (
                    <p className="admin-blog-card-excerpt">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="admin-blog-card-actions">
                    {/* EDITAR */}
                    <button
                      type="button"
                      className="admin-btn-edit"
                      onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                    >
                      Editar
                    </button>

                    {/* PUBLICAR / BORRADOR */}
                    <button
                      type="button"
                      className="admin-btn-outline"
                      onClick={() => handleTogglePublished(post)}
                    >
                      {isPublished ? "Pasar a borrador" : "Publicar"}
                    </button>

                    {/* ELIMINAR */}
                    <button
                      type="button"
                      className="admin-btn-danger"
                      onClick={() => handleDelete(post)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
