// pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { FiMail } from "react-icons/fi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdWarningAmber } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../../assets/style/css/Login.css";

// ===== KONFIGURASI =====
const ADMIN_CONFIG = {
  whatsappNumber: "6285285944423",
  whatsappName: "Admin RT-003",
  emailSupport: "admin@rt003.local",
};

const API_BASE_URL = import.meta.env.DEV ? "http://localhost:3333" : "";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 8 + Math.random() * 10,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
    setLeaves(generated);
  }, []);

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, stayLoggedIn: keepLoggedIn }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Email atau password salah.");
        return;
      }

      // ✅ FIX: AuthController return { user: { role } }, bukan { role }
      const role = data.user?.role;

      const roleRoutes = {
        admin: "/admin/dashboard",
        bendahara: "/bendahara/dashboard",
        warga: "/warga/dashboard",
      };

      const destination = roleRoutes[role];

      if (!destination) {
        setError("Role tidak dikenali. Hubungi Admin.");
        return;
      }

      // ✅ FIX: pakai navigate() bukan window.location.href
      // agar React Router tidak reload halaman penuh
      navigate(destination, { replace: true });
    } catch {
      setError(
        "Gagal terhubung ke server. Pastikan backend berjalan di port 3333.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleHubungiAdmin() {
    const message =
      "Halo Admin RT-003, saya ingin mendaftar ke sistem dashboard warga.";
    const whatsappUrl = `https://wa.me/${ADMIN_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      window.location.href = `${API_BASE_URL}/api/auth/google/redirect`;
    } catch {
      setError("Login Google gagal. Coba lagi.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="ms-page">
      {leaves.map((leaf) => (
        <span
          key={leaf.id}
          className="ms-leaf"
          style={{
            left: `${leaf.left}%`,
            top: `${leaf.top}%`,
            width: leaf.size,
            height: leaf.size * 1.6,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
            transform: `rotate(${leaf.rotation}deg)`,
          }}
        />
      ))}

      <div className="ms-card">
        <div className="ms-card-topbar" />

        <div className="ms-logo">
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            <circle
              cx="21"
              cy="21"
              r="19"
              stroke="var(--clr-primary)"
              strokeWidth="1.5"
              fill="none"
            />
            <circle
              cx="21"
              cy="21"
              r="13"
              stroke="var(--clr-primary)"
              strokeWidth="1"
              fill="none"
            />
            <circle cx="21" cy="21" r="4" fill="var(--clr-primary)" />
            <line
              x1="21"
              y1="2"
              x2="21"
              y2="10"
              stroke="var(--clr-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="21"
              y1="32"
              x2="21"
              y2="40"
              stroke="var(--clr-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="2"
              y1="21"
              x2="10"
              y2="21"
              stroke="var(--clr-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="32"
              y1="21"
              x2="40"
              y2="21"
              stroke="var(--clr-primary)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="ms-title">Dashboard RT-003</h1>
        <p className="ms-subtitle">Masuk ke portal warga anda</p>

        {error && (
          <div className="ms-error">
            <MdWarningAmber size={15} style={{ marginRight: "6px" }} />
            {error}
          </div>
        )}

        <form className="ms-form" onSubmit={handleEmailLogin} noValidate>
          <div className="ms-field">
            <input
              className="ms-input"
              type="email"
              placeholder="Alamat Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <span className="ms-field-icon">
              <FiMail size={14} color="var(--clr-primary)" />
            </span>
          </div>

          <div className="ms-field">
            <input
              className="ms-input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="ms-field-icon ms-field-icon--btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {showPassword ? (
                <FaEyeSlash size={14} color="var(--clr-primary)" />
              ) : (
                <FaEye size={14} color="var(--clr-primary)" />
              )}
            </button>
          </div>

          <div className="ms-row">
            <label className="ms-checkbox-label">
              <span
                className={`ms-checkbox ${keepLoggedIn ? "ms-checkbox--checked" : ""}`}
                onClick={() => setKeepLoggedIn((v) => !v)}
                role="checkbox"
                aria-checked={keepLoggedIn}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && setKeepLoggedIn((v) => !v)}
              >
                {keepLoggedIn && (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              Tetap masuk
            </label>
            <a href="/auth/forgot-password" className="ms-link">
              Lupa password?
            </a>
          </div>

          <button
            type="submit"
            className="ms-btn-primary"
            disabled={loading || !email || !password}
          >
            {loading ? <span className="ms-spinner" /> : "Masuk ke Portal"}
          </button>
        </form>

        <div className="ms-divider">
          <span className="ms-divider-line" />
          <span className="ms-divider-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1L7 13M1 7L13 7M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                stroke="var(--clr-primary-light)"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </span>
          <span className="ms-divider-line" />
        </div>

        <button
          className="ms-btn-google"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          type="button"
        >
          {googleLoading ? (
            <span className="ms-spinner ms-spinner--dark" />
          ) : (
            <FcGoogle size={18} style={{ marginRight: "8px" }} />
          )}
          {googleLoading ? "Menghubungkan…" : "Lanjutkan dengan Google"}
        </button>

        <p className="ms-footer">
          Belum terdaftar?{" "}
          <button
            className="ms-footer-link"
            onClick={handleHubungiAdmin}
            type="button"
          >
            Hubungi Admin
          </button>
        </p>
      </div>
    </div>
  );
}
