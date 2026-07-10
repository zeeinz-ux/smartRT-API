// pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { FiMail } from "react-icons/fi";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { MdWarningAmber } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "../../assets/style/css/Login.css";
import API_BASE_URL from "../../utils/api.js";

// ===== KONFIGURASI =====
const ADMIN_CONFIG = {
  whatsappNumber: "6285288888888", // Ganti dengan nomor WhatsApp admin (format internasional tanpa tanda +)
  whatsappName: "Admin RT-003",
  emailSupport: "admin@rt003.local",
};

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    () => localStorage.getItem("rememberedEmail") || "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    !!localStorage.getItem("rememberedEmail"),
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Baca error dari query string (Google OAuth callback) — pake lazy initializer biar kebaca sebelum StrictMode double-mount
  const [error, setError] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    const e = p.get("error");
    if (e === "email_not_registered")
      return "Email akun belum terdaftar, silahkan hubungi admin.";
    if (e === "access_denied") return "Login Google dibatalkan.";
    if (e === "server_error") return "Terjadi kesalahan server. Coba lagi.";
    return null;
  });

  const [leaves, setLeaves] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [roleNotFound, setRoleNotFound] = useState(false);

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

  // Bersihin query string dari URL setelah render (biar gak ganggu lazy initializer error)
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ── Debounced check role saat email berubah ──
  useEffect(() => {
    if (!email || email.length < 5) {
      setRoleChecked(false);
      setSelectedRole(null);
      setRoleNotFound(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingRole(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/check-role?email=${encodeURIComponent(email)}`,
          {
            credentials: "include",
          },
        );
        const data = await res.json();
        if (data.success && data.exists) {
          setSelectedRole(data.role);
          setRoleChecked(true);
          setRoleNotFound(false);
        } else {
          setSelectedRole(null);
          setRoleChecked(false);
          setRoleNotFound(true);
        }
      } catch {
        setRoleChecked(false);
        setRoleNotFound(false);
      } finally {
        setCheckingRole(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  const roleLabels = {
    admin: "Admin RT",
    bendahara: "Bendahara",
    warga: "Warga",
  };

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email || !password || !selectedRole) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
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

  function handleRememberToggle() {
    setRememberMe((v) => {
      const next = !v;
      if (next) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
      return next;
    });
  }

  // Simpan email kalo rememberMe diaktifkan
  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem("rememberedEmail", email);
    }
  }, [email, rememberMe]);

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

          <div className="ms-field">
            <div className="ms-role-wrapper">
              <select
                className={`ms-input ms-role-select ${roleChecked ? "ms-role--found" : ""} ${roleNotFound ? "ms-role--notfound" : ""}`}
                value={selectedRole || ""}
                disabled={!roleChecked || checkingRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {!roleChecked && (
                  <option value="">
                    {checkingRole
                      ? "Memeriksa..."
                      : "Masukkan email terlebih dahulu"}
                  </option>
                )}
                {roleNotFound && (
                  <option value="">Email tidak terdaftar</option>
                )}
                {roleChecked && selectedRole && (
                  <option value={selectedRole}>
                    {roleLabels[selectedRole] || selectedRole}
                  </option>
                )}
              </select>
              {checkingRole && <span className="ms-role-spinner" />}
            </div>
          </div>

          <div className="ms-row">
            <label className="ms-checkbox-label">
              <span
                className={`ms-checkbox ${rememberMe ? "ms-checkbox--checked" : ""}`}
                onClick={handleRememberToggle}
                role="checkbox"
                aria-checked={rememberMe}
                tabIndex={0}
                onKeyDown={(e) => e.key === " " && handleRememberToggle()}
              >
                {rememberMe && (
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
              Ingat Saya
            </label>

          </div>

          <button
            type="submit"
            className="ms-btn-primary"
            disabled={loading || !email || !password || !selectedRole}
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
