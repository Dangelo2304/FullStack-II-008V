// src/pages/AdminBlogEdit.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBlogPost,
  adminUpdateBlogPost,
  uploadImage,
} from "../api/xano";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminBlog.css";

export default function AdminBlogEdit() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    section: "news",
    tag: "",
    excerpt: "",
    body: "",
    cover_image: null,
    // por si después quieres usarlo
    published: true,
    gallery: [],
  });

  // cargar post
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBlogPost(id);
        setForm({
          title: data.title || "",
          section: data.section || "news",      // news | review | curiosity
          tag: data.tag || "",
          excerpt: data.excerpt || "",
          body: data.body || "",
          cover_image: data.cover_image || null,
          published: data.published ?? true,
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
        });
      } catch (err) {
        console.error("Error al cargar post:", err);
        setError("No se pudo cargar el post para edición.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  // subir portada
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadImage(file);
      setForm((p) => ({
        ...p,
        cover_image: res[0],
      }));
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      alert("No se pudo subir la imagen.");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("El título es obligatorio.");
      return;
    }

    setSaving(true);

    try {
      // nos aseguramos que section tenga uno de los valores válidos
      const payload = {
        ...form,
        section: form.section || "news",
      };

      await adminUpdateBlogPost(id, token, payload);
      navigate("/admin/blog");
    } catch (err) {
      console.error("Error al guardar post:", err.response?.data || err);
      alert("No se pudo guardar el post.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="admin-state">Cargando post...</p>;
  if (error) return <p className="admin-state admin-state-error">{error}</p>;

  return (
    <div className="admin-page edit-page">
      <h1 className="admin-hero-title">EDITAR POST</h1>

      <div className="edit-form">
        <label>Título</label>
        <input
          className="admin-input"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />

        <label>Sección</label>
        <select
          className="admin-select"
          value={form.section}
          onChange={(e) => handleChange("section", e.target.value)}
        >
          {/* 👇 valores EXACTOS que usa Xano */}
          <option value="news">Noticias</option>
          <option value="review">Reseñas</option>
          <option value="curiosity">Curiosidades</option>
        </select>

        <label>Tag</label>
        <input
          className="admin-input"
          value={form.tag}
          onChange={(e) => handleChange("tag", e.target.value)}
        />

        <label>Extracto</label>
        <textarea
          className="admin-textarea"
          value={form.excerpt}
          onChange={(e) => handleChange("excerpt", e.target.value)}
        />

        <label>Contenido</label>
        <textarea
          className="admin-textarea big"
          value={form.body}
          onChange={(e) => handleChange("body", e.target.value)}
        />

        {/* Mostrar portada */}
        {form.cover_image && (
          <img
            className="edit-cover-preview"
            src={
              typeof form.cover_image === "string"
                ? form.cover_image
                : form.cover_image.url
            }
            alt="Portada actual"
          />
        )}

        <label>Nueva portada</label>
        <input type="file" onChange={handleFile} />

        <div className="edit-actions">
          <button
            className="admin-btn-outline"
            onClick={() => navigate("/admin/blog")}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            className="admin-primary-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
