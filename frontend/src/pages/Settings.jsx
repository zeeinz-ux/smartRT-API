import { useState, useMemo } from "react";
import { Eye, EyeOff, Key, Save, Loader, Check, X } from "lucide-react";
import "../assets/style/css/Settings.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

const RULES = [
  { key: "min", label: "Minimal 6 karakter", test: (v) => v.length >= 6 },
  { key: "upper", label: "Huruf besar (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { key: "lower", label: "Huruf kecil (a-z)", test: (v) => /[a-z]/.test(v) },
  { key: "number", label: "Angka (0-9)", test: (v) => /\d/.test(v) },
  { key: "symbol", label: "Simbol (!@#$%^&*)", test: (v) => /[!@#$%^&*(),.?":{}|<>_]/.test(v) },
];

export default function Settings() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [currentPwValid, setCurrentPwValid] = useState(null);
  const [currentPwChecking, setCurrentPwChecking] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "current_password") {
      setCurrentPwValid(null);
    }
  };

  const togglePw = (field) => setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  const rulesPassed = useMemo(() => RULES.map((r) => r.test(form.new_password)), [form.new_password]);
  const allRulesPassed = rulesPassed.every(Boolean);
  const passwordsMatch = form.confirm_password === "" || form.new_password === form.confirm_password;

  async function checkCurrentPassword(password) {
    if (!password) { setCurrentPwValid(null); return; }
    setCurrentPwChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success) setCurrentPwValid(json.valid);
    } catch {
      setCurrentPwValid(null);
    } finally {
      setCurrentPwChecking(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (currentPwValid === false) {
      showToast("Password saat ini salah", "error");
      return;
    }
    if (!form.current_password || !form.new_password || !form.confirm_password) {
      showToast("Semua field harus diisi", "error");
      return;
    }
    if (!allRulesPassed) {
      showToast("Password belum memenuhi semua persyaratan", "error");
      return;
    }
    if (!passwordsMatch) {
      showToast("Konfirmasi password tidak cocok", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Password berhasil diubah");
        setForm({ current_password: "", new_password: "", confirm_password: "" });
        setSubmitted(false);
      } else {
        showToast(json.message, "error");
      }
    } catch {
      showToast("Gagal mengubah password", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="set-panel">
      {toast && (
        <div className={`set-toast set-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="set-header">
        <Key size={24} />
        <div>
          <h1 className="set-header__title">Pengaturan Akun</h1>
          <p className="set-header__sub">Ubah password akun kamu</p>
        </div>
      </div>

      <form className="set-form" onSubmit={handleSubmit}>
        <div className="set-field">
          <label className="set-label">Password Saat Ini</label>
          <div className="set-input-wrap">
            <input
              type={showPw.current ? "text" : "password"}
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              onBlur={(e) => checkCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini"
              className={`set-input ${(submitted && !form.current_password) || currentPwValid === false ? "set-input--error" : currentPwValid === true ? "set-input--ok" : ""}`}
              autoComplete="current-password"
            />
            <button type="button" className="set-eye" onClick={() => togglePw("current")} tabIndex={-1}>
              {showPw.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {currentPwChecking && <span className="set-hint">Memeriksa...</span>}
          {currentPwValid === false && (
            <span className="set-hint set-hint--error">Password saat ini salah</span>
          )}
          {currentPwValid === true && (
            <span className="set-hint set-hint--ok">Password benar</span>
          )}
        </div>

        <div className="set-field">
          <label className="set-label">Password Baru</label>
          <div className="set-input-wrap">
            <input
              type={showPw.new ? "text" : "password"}
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              placeholder="Buat password baru"
              className="set-input"
              autoComplete="new-password"
            />
            <button type="button" className="set-eye" onClick={() => togglePw("new")} tabIndex={-1}>
              {showPw.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Rules checklist */}
          {form.new_password && (
            <div className="set-rules">
              {RULES.map((rule, i) => (
                <span key={rule.key} className={`set-rule ${rulesPassed[i] ? "set-rule--ok" : "set-rule--fail"}`}>
                  {rulesPassed[i] ? <Check size={12} /> : <X size={12} />}
                  {rule.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="set-field">
          <label className="set-label">Konfirmasi Password Baru</label>
          <div className="set-input-wrap">
            <input
              type={showPw.confirm ? "text" : "password"}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Ketik ulang password baru"
              className={`set-input ${form.confirm_password && !passwordsMatch ? "set-input--error" : ""}`}
              autoComplete="new-password"
            />
            <button type="button" className="set-eye" onClick={() => togglePw("confirm")} tabIndex={-1}>
              {showPw.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.confirm_password && !passwordsMatch && (
            <span className="set-hint set-hint--error">Password tidak cocok</span>
          )}
          {form.confirm_password && passwordsMatch && (
            <span className="set-hint set-hint--ok">Password cocok</span>
          )}
        </div>

        <button type="submit" className="set-submit" disabled={loading}>
          {loading ? <Loader size={18} className="set-spin" /> : <Save size={18} />}
          {loading ? "Menyimpan..." : "Simpan Password"}
        </button>
      </form>
    </div>
  );
}
