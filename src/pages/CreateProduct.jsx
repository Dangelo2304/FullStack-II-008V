import React, { useState, useEffect } from "react";
import { uploadImage, createProduct } from "../api/xano";

export default function CreateProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [genero, setGenero] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [message, setMessage] = useState("");

  // --- Subir producto ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      let uploadRes = [];

      // Subir imágenes primero (con orden de portada)
      if (images && images.length > 0) {
        const ordered = images.slice();
        if (primaryIndex > 0 && primaryIndex < images.length) {
          const [first] = ordered.splice(primaryIndex, 1);
          ordered.unshift(first);
        }

        const results = await Promise.all(ordered.map((f) => uploadImage(f)));
        uploadRes = results.flat();
        console.log("📸 Respuesta de Xano (upload):", uploadRes);
      }

      if (!uploadRes.length) {
        throw new Error("No se recibieron imágenes válidas del upload.");
      }

      // Crear el producto con los campos correctos del backend
      const product = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        genero,
        descripcion,
        image: uploadRes,
      };

      const res = await createProduct(product);
      console.log("🧡 Producto creado:", res);
      setMessage("✅ Producto creado correctamente en KameHouse.");

      // Limpiar formulario
      setName("");
      setPrice("");
      setStock("");
      setGenero("");
      setDescripcion("");
      setImages([]);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews([]);
      setPrimaryIndex(0);
    } catch (err) {
      console.error("❌ Error al crear producto:", err);
      setMessage("Error al crear producto. Revisa consola.");
    }
  };

  // --- Control de archivos ---
  const handleFile = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    previews.forEach((p) => URL.revokeObjectURL(p));
    setImages(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    setPrimaryIndex(0);
  };

  // --- Estilos responsivos internos ---
  const [isNarrow, setIsNarrow] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 720 : false
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth <= 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- Limpieza de previews al desmontar ---
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  // --- Sistema de estilos (mantiene tu look) ---
  const S = {
    container: {
      background:
        "linear-gradient(180deg, rgba(255,127,50,0.02), rgba(27,11,6,0.02))",
      padding: "1.75rem",
      borderRadius: "1rem",
      border: "1px solid rgba(255,146,52,0.04)",
      boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
      maxWidth: "900px",
    },
    title: { margin: "0 0 1rem 0" },
    form: {
      display: "grid",
      gridTemplateColumns: isNarrow ? "1fr" : "3fr 1fr",
      gap: "1.6rem",
      alignItems: "start",
      gridTemplateAreas: isNarrow
        ? `"name" "price" "stock" "genero" "descripcion" "file" "preview" "button"`
        : `"name name" "price preview" "stock preview" "genero preview" "descripcion descripcion" "file file" "button button"`,
    },
    input: {
      background:
        "linear-gradient(180deg, rgba(255,127,50,0.04), rgba(255,159,77,0.01))",
      border: "1px solid rgba(255,146,52,0.10)",
      color: "var(--kame-text)",
      padding: "1rem 1rem",
      borderRadius: "0.8rem",
      boxShadow: "none",
      minHeight: "56px",
      fontSize: "1rem",
    },
    file: {
      gridArea: "file",
      padding: "0.45rem",
      background: "rgba(255,127,50,0.02)",
    },
    preview: {
      gridArea: "preview",
      width: "100%",
      height: "20rem",
      objectFit: "cover",
      borderRadius: "0.75rem",
      border: "1px solid rgba(255,146,52,0.06)",
    },
    button: {
      gridArea: "button",
      background: "var(--kame-accent)",
      color: "#1b0f06",
      border: "1px solid rgba(0,0,0,0.06)",
      padding: "1rem",
      borderRadius: "0.8rem",
      fontWeight: 800,
      cursor: "pointer",
    },
    name: { gridArea: "name" },
    price: { gridArea: "price" },
    stock: { gridArea: "stock" },
    genero: { gridArea: "genero" },
    descripcion: { gridArea: "descripcion" },
  };

  return (
    <div className="p-4 mx-auto text-white" style={S.container}>
      <h2 className="text-2xl font-bold mb-4" style={S.title}>
        Crear producto
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3" style={S.form}>
        <input
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...S.input, ...S.name }}
          required
        />

        <input
          type="number"
          placeholder="Precio"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ ...S.input, ...S.price }}
          required
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          style={{ ...S.input, ...S.stock }}
          required
        />

        <input
          placeholder="Género / Categoría"
          value={genero}
          onChange={(e) => setGenero(e.target.value)}
          style={{ ...S.input, ...S.genero }}
        />

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ ...S.input, ...S.descripcion, minHeight: "7rem" }}
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFile}
          style={S.file}
        />

        {previews && previews.length > 0 && (
          <div style={{ gridArea: "preview" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {previews.map((p, idx) => (
                <div key={p} style={{ position: "relative", width: "48%" }}>
                  <img
                    src={p}
                    alt={`Preview ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "9rem",
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                      border:
                        idx === primaryIndex
                          ? "2px solid rgba(255,183,77,0.95)"
                          : "1px solid rgba(255,146,52,0.06)",
                      boxShadow:
                        idx === primaryIndex
                          ? "0 8px 30px rgba(255,146,52,0.12)"
                          : "none",
                      cursor: "pointer",
                    }}
                    onClick={() => setPrimaryIndex(idx)}
                    title={
                      idx === primaryIndex
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
                        idx === primaryIndex
                          ? "rgba(255,183,77,0.98)"
                          : "rgba(0,0,0,0.45)",
                      color: idx === primaryIndex ? "#1b0f06" : "#fff",
                      padding: "4px 6px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  >
                    {idx === primaryIndex ? "Portada" : "Hacer portada"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" style={S.button}>
          Subir producto
        </button>

        {message && (
          <p
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              fontWeight: 700,
              marginTop: "0.6rem",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
