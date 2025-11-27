import { useState, useRef, useEffect } from "react";
import "./MonthYearPicker.css";

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function MonthYearPicker({ value, onChange, minYear }) {
  const now = new Date();
  const startYear = minYear || now.getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const [open, setOpen] = useState(false);
  const [selMonth, setSelMonth] = useState(null);
  const [selYear, setSelYear] = useState(startYear);
  const ref = useRef(null);

  useEffect(() => {
    // parse incoming value MM/AA
    if (value && /^\d{2}\/\d{2}$/.test(value)) {
      const parts = value.split("/");
      const m = parseInt(parts[0], 10);
      const y = parseInt(parts[1], 10);
      if (!isNaN(m)) setSelMonth(m);
      if (!isNaN(y)) setSelYear(2000 + y);
    }
  }, [value]);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commit(month, year) {
    const mm = pad(month);
    const yy = String(year).slice(-2);
    const val = `${mm}/${yy}`;
    onChange && onChange(val);
    setSelMonth(month);
    setSelYear(year);
    setOpen(false);
  }

  return (
    <div className="mmy-picker" ref={ref}>
      <input
        type="text"
        className="mmy-input"
        placeholder="MM/AA"
        value={value || ""}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        readOnly
        aria-label="Seleccionar mes y año de vencimiento"
      />

      <button
        type="button"
        className="mmy-clear"
        onClick={() => {
          onChange("");
          setSelMonth(null);
        }}
        title="Borrar"
      >
        ×
      </button>

      {open && (
        <div className="mmy-pop">
          <div className="mmy-months">
            {months.map((name, idx) => {
              const monthNum = idx + 1;
              return (
                <button
                  key={name}
                  type="button"
                  className={`mmy-month ${selMonth === monthNum ? "active" : ""}`}
                  onClick={() => commit(monthNum, selYear)}
                >
                  <span className="mmy-month-num">{pad(monthNum)}</span>
                  <small className="mmy-month-name">{name}</small>
                </button>
              );
            })}
          </div>

          <div className="mmy-year-row">
            <button
              type="button"
              className="mmy-year-nav"
              onClick={() => setSelYear((y) => Math.max(startYear, y - 1))}
            >
              ‹
            </button>
            <select
              className="mmy-year-select"
              value={selYear}
              onChange={(e) => setSelYear(Number(e.target.value))}
              aria-label="Año de vencimiento"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              className="mmy-year-nav"
              onClick={() => setSelYear((y) => y + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
