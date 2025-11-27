// src/pages/Blog.jsx
import { useEffect, useState, useMemo } from "react";
import { listBlogPosts } from "../api/xano.js";
import "./Blog.css";

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

  if (typeof img === "string") return img;
  if (img.url) return img.url;
  if (img.path) return `https://x8ki-letl-twmt.n7.xano.io${img.path}`;
  return null;
};

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listBlogPosts();
        setPosts(Array.isArray(data) ? data : []);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const news = useMemo(() => posts.filter((p) => p.section === "news"), [posts]);
  const reviews = useMemo(() => posts.filter((p) => p.section === "review"), [posts]);
  const curiosities = useMemo(() => posts.filter((p) => p.section === "curiosity"), [posts]);

  if (loading) return <p className="loading">Cargando blog...</p>;

  return (
    <div className="blog-page">

      <h1 className="blog-title">BLOG GAMER KAMEHOUSE</h1>
      <p className="blog-subtitle">
        Noticias, reseñas y curiosidades del mundo de los videojuegos.
      </p>

      {/* --------------------- SECCIÓN: NOTICIAS --------------------- */}
      {news.length > 0 && (
        <section className="blog-section">
          <h2 className="blog-section-title neon-orange">Noticias</h2>
          <div className="blog-grid">
            {news.map((post) => {
              const cover = getCoverUrl(post);

              return (
                <article key={post.id} className="blog-card blog-card-news">
                  {cover && <img src={cover} className="blog-card-img" alt={post.title} />}
                  <div className="blog-card-body">
                    <span className="badge badge-news">NEWS</span>
                    {post.tag && <span className="badge badge-tag">#{post.tag}</span>}
                    <span className="blog-card-date">{formatDate(post.created_at)}</span>

                    <h3 className="blog-card-title">{post.title}</h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>

                    <a className="blog-card-btn" href={`/blog/${post.id}`}>
                      Leer más →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* --------------------- SECCIÓN: RESEÑAS --------------------- */}
      {reviews.length > 0 && (
        <section className="blog-section">
          <h2 className="blog-section-title neon-blue">Reseñas</h2>
          <div className="blog-grid">
            {reviews.map((post) => {
              const cover = getCoverUrl(post);

              return (
                <article key={post.id} className="blog-card blog-card-review">
                  {cover && <img src={cover} className="blog-card-img" alt={post.title} />}
                  <div className="blog-card-body">
                    <span className="badge badge-review">REVIEW</span>
                    {post.tag && <span className="badge badge-tag">#{post.tag}</span>}
                    <span className="blog-card-date">{formatDate(post.created_at)}</span>

                    <h3 className="blog-card-title">{post.title}</h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>

                    <a className="blog-card-btn" href={`/blog/${post.id}`}>
                      Leer más →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ------------------ SECCIÓN: CURIOSIDADES ------------------ */}
      {curiosities.length > 0 && (
        <section className="blog-section">
          <h2 className="blog-section-title neon-purple">Curiosidades</h2>
          <div className="blog-grid">
            {curiosities.map((post) => {
              const cover = getCoverUrl(post);

              return (
                <article key={post.id} className="blog-card blog-card-curiosity">
                  {cover && <img src={cover} className="blog-card-img" alt={post.title} />}
                  <div className="blog-card-body">
                    <span className="badge badge-curiosity">CURIOSITY</span>
                    {post.tag && <span className="badge badge-tag">#{post.tag}</span>}
                    <span className="blog-card-date">{formatDate(post.created_at)}</span>

                    <h3 className="blog-card-title">{post.title}</h3>
                    <p className="blog-card-excerpt">{post.excerpt}</p>

                    <a className="blog-card-btn" href={`/blog/${post.id}`}>
                      Leer más →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
