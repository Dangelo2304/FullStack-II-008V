import React, { useState } from "react";

export default function ProductImagesSlider({ images = [], alt }) {
  const [index, setIndex] = useState(0);
  if (!images || images.length === 0) return null;

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const current =
    images[index]?.url || `https://x8ki-letl-twmt.n7.xano.io${images[index]?.path}`;

  return (
    <div className="position-relative">
      <img
        src={current}
        alt={alt}
        className="card-img-top rounded-top-4"
        style={{ height: "200px", objectFit: "cover" }}
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="btn btn-sm btn-light position-absolute top-50 start-0 translate-middle-y ms-2"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="btn btn-sm btn-light position-absolute top-50 end-0 translate-middle-y me-2"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
