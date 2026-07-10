import { useState, useEffect } from "react";

function formatRupiah(value) {
  const num = parseInt(value, 10);
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function RupiahInput({
  value,
  onChange,
  placeholder = "0",
  required = false,
  disabled = false,
  min = 0,
  name,
}) {
  const [display, setDisplay] = useState(() => (value !== null && value !== undefined && value !== '' ? formatRupiah(String(value)) : ''));

  useEffect(() => {
    setDisplay(value !== null && value !== undefined && value !== '' ? formatRupiah(String(value)) : '');
  }, [value]);

  function handleChange(e) {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setDisplay(formatRupiah(raw));
    onChange(raw || "");
  }

  return (
    <div className="rupiah-input-wrapper" style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span
        style={{
          position: "absolute",
          left: 12,
          pointerEvents: "none",
          color: "var(--clr-subtitle)",
          fontSize: "0.9rem",
          zIndex: 1,
        }}
      >
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        name={name}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        style={{
          paddingLeft: 40,
          width: "100%",
        }}
      />
    </div>
  );
}
