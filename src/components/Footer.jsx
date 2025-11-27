import { useEffect, useState } from "react";

export default function Footer(){
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const nearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 48);
      setVisible(nearBottom);
    }
    // initial check
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <footer className={`kame-footer ${visible ? 'kame-footer--visible' : 'kame-footer--hidden'}`} aria-hidden={!visible}>
      <div className="container py-3 d-flex justify-content-between align-items-center">
        <div className="text-start">
          <strong className="retro-title">KameHouse</strong>
          <div className="small text-muted">Tienda de videojuegos - Todos los derechos reservados</div>
        </div>
        <div className="text-end small">
          <div className="retro-hint">Contacto: soporte@kamehouse.local</div>
          <div className="mt-1">© {new Date().getFullYear()}</div>
        </div>
      </div>
    </footer>
  )
}
