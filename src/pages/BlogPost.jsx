// src/pages/BlogPost.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getBlogPost } from "../api/xano.js";
import "./Blog.css";

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBlogPost(id);
        setPost(data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar esta entrada del blog.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatDate = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const buildCoverUrl = (cover) => {
    if (!cover) return null;

    const BASE = "https://x8ki-letl-twmt.n7.xano.io";

    // string simple
    if (typeof cover === "string") {
      if (cover.startsWith("/vault/") || cover.startsWith("/")) {
        return BASE + cover;
      }
      return cover;
    }

    // objeto
    if (cover.url) return cover.url;
    if (cover.path) {
      if (cover.path.startsWith("/vault/") || cover.path.startsWith("/")) {
        return BASE + cover.path;
      }
      return cover.path;
    }

    return null;
  };

  const coverUrl = buildCoverUrl(post?.cover_image);

  const paragraphs =
    post?.body?.split(/\n{2,}/).filter((p) => p.trim().length > 0) || [];

  return (
    <div className="blog-page">
      {loading && <p className="blog-state">Cargando entrada...</p>}
      {error && <p className="blog-state text-danger">{error}</p>}

      {!loading && !error && !post && (
        <p className="blog-state">No se encontró esta entrada.</p>
      )}

      {!loading && !error && post && (
        <>
          {/* CABECERA */}
          <section className="blog-hero" style={{ marginBottom: "1.4rem" }}>
            <p
              style={{
                fontSize: "0.8rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                marginBottom: 6,
              }}
            >
              {(post.section || "BLOG").toUpperCase()} ·{" "}
              {formatDate(post.created_at)}
            </p>
            <h1 className="blog-hero-title" style={{ marginBottom: 10 }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="blog-hero-subtitle">{post.excerpt}</p>
            )}
            <div
              style={{ marginTop: 10, fontSize: "0.85rem", opacity: 0.9 }}
            >
              {post.author && <span>Por {post.author}</span>}
              {post.tag && (
                <span style={{ marginLeft: 12, opacity: 0.8 }}>
                  · {post.tag}
                </span>
              )}
            </div>
          </section>

          {/* IMAGEN PRINCIPAL */}
          {coverUrl && (
            <div
              style={{
                borderRadius: 18,
                overflow: "hidden",
                marginBottom: "1.8rem",
                boxShadow: "0 0 26px rgba(0,0,0,0.95)",
                border: "1px solid rgba(255,193,94,0.4)",
              }}
            >
              <img
                src={coverUrl}
                alt={post.title}
                style={{
                  width: "100%",
                  maxHeight: 460,
                  objectFit: "cover",
                }}
              />
            </div>
          )}

          {/* CONTENIDO */}
          <article
            style={{
              background:
                "radial-gradient(circle at top, rgba(255,193,94,0.12), #080309)",
              borderRadius: 18,
              padding: "1.4rem 1.6rem 1.6rem",
              border: "1px solid rgba(255,193,94,0.4)",
              boxShadow: "0 0 28px rgba(0,0,0,0.95)",
            }}
          >
            {paragraphs.length > 0 ? (
              paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  style={{
                    marginBottom: "0.95rem",
                    lineHeight: 1.6,
                    fontSize: "0.98rem",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {p}
                </p>
              ))
            ) : (
              <p>{post.body}</p>
            )}

            {/* GALERÍA OPCIONAL */}
            {Array.isArray(post?.gallery) && post.gallery.length > 0 && (
              <div style={{ marginTop: "1.6rem" }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#ffc857",
                    marginBottom: "0.9rem",
                  }}
                >
                  Galería
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "10px",
                  }}
                >
                  {post.gallery.map((img, idx) => {
                    const url =
                      buildCoverUrl(img) ||
                      img?.url ||
                      img?.path ||
                      null;
                    if (!url) return null;
                    return (
                      <img
                        key={idx}
                        src={url}
                        alt={`Imagen ${idx + 1}`}
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          objectFit: "cover",
                          maxHeight: 190,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </article>

          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/blog" className="blog-read-more-btn">
              ← Volver al blog
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
