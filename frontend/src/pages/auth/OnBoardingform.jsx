import { useState, useRef, useCallback } from "react";
import "../../assets/style/css/OnboardingForm.css";
import { validateNIK, validateKK } from "../../utils/kependudukan.js";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3333";

const STEPS = [
  { id: 1, label: "Identitas", icon: "👤", desc: "Data diri & NIK" },
  { id: 2, label: "Alamat", icon: "🏠", desc: "Info hunian" },
  { id: 3, label: "Foto KTP", icon: "📄", desc: "Upload dokumen" },
  { id: 4, label: "Konfirmasi", icon: "✅", desc: "Review & kirim" },
];

const STATUS_HUNI_OPTIONS = [
  { value: "milik_sendiri", label: "Milik Sendiri" },
  { value: "kontrak", label: "Kontrak / Sewa" },
  { value: "numpang", label: "Numpang / Keluarga" },
  { value: "lainnya", label: "Lainnya" },
];

// ─── Validators ───────────────────────────────────────────────────────────────
const validators = {
  nik: (v) => validateNIK(v),
  kk: (v) => validateKK(v),
  nama_lengkap: (v) => {
    if (!v?.trim()) return "Nama lengkap wajib diisi";
    if (v.trim().length < 3) return "Nama terlalu pendek";
    return null;
  },
  no_hp: (v) => {
    const clean = (v || "").toString().trim().replace(/\D/g, "");
    if (!clean) return "Nomor HP wajib diisi";
    if (!/^(?:\+62|62|0)?8[1-9][0-9]{7,11}$/.test(clean)) {
      return "Format nomor HP tidak valid";
    }
    return null;
  },
  alamat: (v) => {
    if (!v?.trim()) return "Alamat wajib diisi";
    if (v.trim().length < 10) return "Alamat terlalu singkat";
    return null;
  },
  no_rumah: (v) => {
    if (!v?.trim()) return "Nomor rumah wajib diisi";
    return null;
  },
  status_huni: (v) => {
    if (!v) return "Status hunian wajib dipilih";
    return null;
  },
  foto_ktp: (v) => {
    if (!v) return "Foto KTP wajib diupload";
    return null;
  },
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }) {
  if (!message) return null;
  return <span className="obf-field-error">{message}</span>;
}

function StepIndicator({ current, steps }) {
  return (
    <div className="obf-steps">
      {steps.map((step, idx) => {
        const state =
          idx + 1 < current
            ? "done"
            : idx + 1 === current
              ? "active"
              : "pending";
        return (
          <div key={step.id} className={`obf-step obf-step--${state}`}>
            <div className="obf-step__bubble">
              {state === "done" ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="obf-step__icon">{step.icon}</span>
              )}
            </div>
            <div className="obf-step__info">
              <span className="obf-step__label">{step.label}</span>
              <span className="obf-step__desc">{step.desc}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`obf-step__connector ${state === "done" ? "obf-step__connector--done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Identitas ────────────────────────────────────────────────────────
function StepIdentitas({ data, onChange, errors, touched, onBlur }) {
  return (
    <div className="obf-fields">
      <div className="obf-step-header">
        <h2 className="obf-step-title">Data Identitas</h2>
        <p className="obf-step-subtitle">
          Pastikan data sesuai dengan KTP yang berlaku
        </p>
      </div>

      <div className="obf-field">
        <label className="obf-label">
          Nama Lengkap <span className="obf-required">*</span>
        </label>
        <input
          className={`obf-input ${touched.nama_lengkap && errors.nama_lengkap ? "obf-input--error" : ""}`}
          type="text"
          placeholder="Sesuai KTP"
          value={data.nama_lengkap}
          onChange={(e) => onChange("nama_lengkap", e.target.value)}
          onBlur={() => onBlur("nama_lengkap")}
          autoComplete="name"
        />
        <FieldError message={touched.nama_lengkap && errors.nama_lengkap} />
      </div>

      <div className="obf-field-row">
        <div className="obf-field">
          <label className="obf-label">
            NIK <span className="obf-required">*</span>
          </label>
          <input
            className={`obf-input ${touched.nik && errors.nik ? "obf-input--error" : ""}`}
            type="text"
            inputMode="numeric"
            placeholder="16 digit NIK"
            maxLength={16}
            value={data.nik}
            onChange={(e) => onChange("nik", e.target.value.replace(/\D/g, ""))}
            onBlur={() => onBlur("nik")}
          />
          <FieldError message={touched.nik && errors.nik} />
        </div>

        <div className="obf-field">
          <label className="obf-label">
            Nomor KK <span className="obf-required">*</span>
          </label>
          <input
            className={`obf-input ${touched.kk && errors.kk ? "obf-input--error" : ""}`}
            type="text"
            inputMode="numeric"
            placeholder="16 digit No. KK"
            maxLength={16}
            value={data.kk}
            onChange={(e) => onChange("kk", e.target.value.replace(/\D/g, ""))}
            onBlur={() => onBlur("kk")}
          />
          <FieldError message={touched.kk && errors.kk} />
        </div>
      </div>

      <div className="obf-field">
        <label className="obf-label">
          Nomor HP Aktif <span className="obf-required">*</span>
        </label>
        <div className="obf-input-prefix-wrap">
          <span className="obf-input-prefix">+62</span>
          <input
            className={`obf-input obf-input--prefixed ${touched.no_hp && errors.no_hp ? "obf-input--error" : ""}`}
            type="tel"
            inputMode="tel"
            placeholder="81234567890"
            value={data.no_hp}
            onChange={(e) =>
              onChange("no_hp", e.target.value.replace(/[^\d]/g, ""))
            }
            onBlur={() => onBlur("no_hp")}
          />
        </div>
        <FieldError message={touched.no_hp && errors.no_hp} />
      </div>

      <div className="obf-info-box">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>
          Data akan diverifikasi oleh Admin RT sebelum akun aktif sepenuhnya.
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Alamat ───────────────────────────────────────────────────────────
function StepAlamat({ data, onChange, errors, touched, onBlur }) {
  return (
    <div className="obf-fields">
      <div className="obf-step-header">
        <h2 className="obf-step-title">Informasi Hunian</h2>
        <p className="obf-step-subtitle">
          Alamat tempat tinggal di lingkungan RT-003
        </p>
      </div>

      <div className="obf-field">
        <label className="obf-label">
          Alamat Lengkap <span className="obf-required">*</span>
        </label>
        <textarea
          className={`obf-textarea ${touched.alamat && errors.alamat ? "obf-input--error" : ""}`}
          placeholder="Nama jalan, Gang, RT/RW, Kelurahan, Kecamatan"
          rows={3}
          value={data.alamat}
          onChange={(e) => onChange("alamat", e.target.value)}
          onBlur={() => onBlur("alamat")}
        />
        <FieldError message={touched.alamat && errors.alamat} />
      </div>

      <div className="obf-field-row">
        <div className="obf-field">
          <label className="obf-label">
            No. Rumah di RT-003 <span className="obf-required">*</span>
          </label>
          <input
            className={`obf-input ${touched.no_rumah && errors.no_rumah ? "obf-input--error" : ""}`}
            type="text"
            placeholder="Cth: 12A, 5B"
            value={data.no_rumah}
            onChange={(e) => onChange("no_rumah", e.target.value)}
            onBlur={() => onBlur("no_rumah")}
          />
          <FieldError message={touched.no_rumah && errors.no_rumah} />
        </div>

        <div className="obf-field">
          <label className="obf-label">
            Status Hunian <span className="obf-required">*</span>
          </label>
          <div className="obf-select-wrap">
            <select
              className={`obf-select ${touched.status_huni && errors.status_huni ? "obf-input--error" : ""}`}
              value={data.status_huni}
              onChange={(e) => onChange("status_huni", e.target.value)}
              onBlur={() => onBlur("status_huni")}
            >
              <option value="">-- Pilih --</option>
              {STATUS_HUNI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg
              className="obf-select-arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <FieldError message={touched.status_huni && errors.status_huni} />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Foto KTP ─────────────────────────────────────────────────────────
function StepFotoKTP({ data, onChange, errors, touched, onBlur }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState(null);

  const processFile = useCallback(
    (file) => {
      setFileError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError("Format tidak didukung. Gunakan JPG, PNG, atau WEBP.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(
          `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        onChange("foto_ktp", {
          file,
          preview: e.target.result,
          name: file.name,
          size: file.size,
        });
        onBlur("foto_ktp");
      };
      reader.readAsDataURL(file);
    },
    [onChange, onBlur],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="obf-fields">
      <div className="obf-step-header">
        <h2 className="obf-step-title">Foto KTP</h2>
        <p className="obf-step-subtitle">
          Upload foto KTP yang jelas dan terbaca
        </p>
      </div>

      {data.foto_ktp?.preview ? (
        <div className="obf-ktp-preview">
          <img
            src={data.foto_ktp.preview}
            alt="Preview KTP"
            className="obf-ktp-img"
          />
          <div className="obf-ktp-meta">
            <div className="obf-ktp-meta__info">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <div>
                <p className="obf-ktp-meta__name">{data.foto_ktp.name}</p>
                <p className="obf-ktp-meta__size">
                  {formatSize(data.foto_ktp.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="obf-ktp-remove"
              onClick={() => {
                onChange("foto_ktp", null);
                setFileError(null);
              }}
            >
              Ganti Foto
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`obf-dropzone ${dragOver ? "obf-dropzone--active" : ""} ${touched.foto_ktp && errors.foto_ktp ? "obf-dropzone--error" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="obf-dropzone__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="obf-dropzone__primary">Seret foto KTP ke sini</p>
          <p className="obf-dropzone__secondary">atau pilih metode di bawah</p>
          <div
            className="obf-dropzone__actions"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="obf-upload-btn obf-upload-btn--gallery"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Dari Galeri
            </button>
            <button
              type="button"
              className="obf-upload-btn obf-upload-btn--camera"
              onClick={() => cameraInputRef.current?.click()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Kamera
            </button>
          </div>
          <p className="obf-dropzone__hint">JPG, PNG, WEBP • Maks. 2MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="obf-hidden-input"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) processFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="obf-hidden-input"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) processFile(f);
          e.target.value = "";
        }}
      />

      {fileError && (
        <span className="obf-field-error obf-field-error--standalone">
          {fileError}
        </span>
      )}
      {!fileError && touched.foto_ktp && errors.foto_ktp && (
        <span className="obf-field-error obf-field-error--standalone">
          {errors.foto_ktp}
        </span>
      )}

      <div className="obf-tips">
        <p className="obf-tips__title">Tips foto yang baik:</p>
        <ul className="obf-tips__list">
          <li>Semua teks pada KTP harus terbaca jelas</li>
          <li>Foto tidak buram, blur, atau terpotong</li>
          <li>Pastikan cahaya cukup, hindari silau</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Step 4: Konfirmasi ───────────────────────────────────────────────────────
function StepKonfirmasi({ data }) {
  const statusLabel =
    STATUS_HUNI_OPTIONS.find((o) => o.value === data.status_huni)?.label || "-";

  const rows = [
    { label: "Nama Lengkap", value: data.nama_lengkap || "-" },
    { label: "NIK", value: data.nik || "-" },
    { label: "Nomor KK", value: data.kk || "-" },
    { label: "Nomor HP", value: data.no_hp ? `+62 ${data.no_hp}` : "-" },
    { label: "Alamat", value: data.alamat || "-" },
    { label: "No. Rumah", value: data.no_rumah || "-" },
    { label: "Status Hunian", value: statusLabel },
  ];

  return (
    <div className="obf-fields">
      <div className="obf-step-header">
        <h2 className="obf-step-title">Konfirmasi Data</h2>
        <p className="obf-step-subtitle">Periksa kembali sebelum mengirim</p>
      </div>

      <div className="obf-review-card">
        {rows.map((row) => (
          <div key={row.label} className="obf-review-row">
            <span className="obf-review-label">{row.label}</span>
            <span className="obf-review-value">{row.value}</span>
          </div>
        ))}
        {data.foto_ktp?.preview && (
          <div className="obf-review-row obf-review-row--ktp">
            <span className="obf-review-label">Foto KTP</span>
            <img
              src={data.foto_ktp.preview}
              alt="KTP"
              className="obf-review-ktp-thumb"
            />
          </div>
        )}
      </div>

      <div className="obf-info-box obf-info-box--yellow">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p>
          Data kamu akan ditinjau oleh Admin RT. Kamu akan mendapat notifikasi
          setelah disetujui. Data baru tercatat di sistem setelah verifikasi.
        </p>
      </div>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onGoToDashboard }) {
  return (
    <div className="obf-success">
      <div className="obf-success__anim">
        <svg className="obf-success__ring" viewBox="0 0 100 100">
          <circle className="obf-success__ring-bg" cx="50" cy="50" r="44" />
          <circle className="obf-success__ring-fill" cx="50" cy="50" r="44" />
        </svg>
        <svg
          className="obf-success__check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="obf-success__title">Profil Berhasil Dibuat!</h2>
      <p className="obf-success__body">
        Data kamu sudah kami terima. Admin RT akan memverifikasi dalam{" "}
        <strong>1×24 jam</strong>. Kamu akan mendapat notifikasi setelah akun
        aktif.
      </p>
      <button
        className="obf-btn obf-btn--primary obf-btn--full"
        onClick={onGoToDashboard}
      >
        Lanjut ke Dashboard
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const INITIAL_DATA = {
  nama_lengkap: "",
  nik: "",
  kk: "",
  no_hp: "",
  alamat: "",
  no_rumah: "",
  status_huni: "",
  foto_ktp: null,
};

const STEP_FIELDS = {
  1: ["nama_lengkap", "nik", "kk", "no_hp"],
  2: ["alamat", "no_rumah", "status_huni"],
  3: ["foto_ktp"],
  4: [],
};

export default function OnboardingForm({ onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(INITIAL_DATA);
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isDone, setIsDone] = useState(false);

  // Compute all errors from current data
  const errors = Object.fromEntries(
    Object.entries(validators).map(([key, fn]) => [key, fn(data[key])]),
  );

  const onChange = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const onBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const touchStepFields = (stepNum) => {
    const fields = STEP_FIELDS[stepNum];
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(fields.map((f) => [f, true])),
    }));
  };

  const isStepValid = (stepNum) => {
    return STEP_FIELDS[stepNum].every((f) => !errors[f]);
  };

  const handleNext = () => {
    touchStepFields(step);
    if (!isStepValid(step)) return;

    // Cross-field: NIK dan KK harus beda
    if (step === 1 && data.nik && data.kk && data.nik === data.kk) {
      return
    }

    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
    setSubmitError(null);
  };

  // Cross-field error untuk step 1
  const nikKkSameError = step === 1 && data.nik && data.kk && data.nik === data.kk

  const handleSubmit = async () => {
    touchStepFields(step);
    setTouched(
      Object.fromEntries(Object.keys(validators).map((k) => [k, true])),
    );

    const allValid = Object.values(errors).every((e) => !e);
    if (!allValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      // ✅ FIX: Trim semua data sebelum kirim
      formData.append("nama_lengkap", data.nama_lengkap.toString().trim());
      formData.append("nik", data.nik.toString().trim());
      formData.append("kk", data.kk.toString().trim());
      formData.append("no_hp", `+62${data.no_hp.toString().trim()}`);
      formData.append("alamat", data.alamat.toString().trim());
      formData.append("no_rumah", data.no_rumah.toString().trim());
      formData.append("status_huni", data.status_huni);

      if (data.foto_ktp?.file) {
        formData.append("foto_ktp", data.foto_ktp.file);
      }

      const res = await fetch(`${API_BASE}/api/warga/onboarding`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json.message || "Terjadi kesalahan. Silakan coba lagi.",
        );
      }

      setIsDone(true);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoToDashboard = () => {
    if (onComplete) onComplete();
    else window.location.href = "/warga/dashboard";
  };

  if (isDone) {
    return (
      <div className="obf-wrapper">
        <div className="obf-card obf-card--success">
          <SuccessScreen onGoToDashboard={handleGoToDashboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="obf-wrapper">
      {/* Background geometric shapes */}
      <div className="obf-bg">
        <div className="obf-bg__shape obf-bg__shape--1" />
        <div className="obf-bg__shape obf-bg__shape--2" />
        <div className="obf-bg__shape obf-bg__shape--3" />
        <div className="obf-bg__dots" />
      </div>

      <div className="obf-card">
        {/* Header */}
        <div className="obf-header">
          <div className="obf-header__logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="var(--clr-primary)" />
              <path
                d="M20 8L28 14V26L20 32L12 26V14L20 8Z"
                fill="white"
                fillOpacity="0.9"
              />
              <circle cx="20" cy="20" r="4" fill="var(--clr-primary)" />
            </svg>
          </div>
          <div>
            <h1 className="obf-header__title">Lengkapi Profil</h1>
            <p className="obf-header__sub">RT-003 • Pendaftaran Warga</p>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} steps={STEPS} />

        {/* Progress bar */}
        <div className="obf-progress">
          <div
            className="obf-progress__bar"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Form content */}
        <div className="obf-content">
          {step === 1 && (
            <StepIdentitas
              data={data}
              onChange={onChange}
              errors={errors}
              touched={touched}
              onBlur={onBlur}
            />
          )}
          {step === 1 && nikKkSameError && (
            <div className="obf-field-error obf-field-error--standalone" style={{ marginTop: 0 }}>
              NIK dan Nomor KK tidak boleh sama
            </div>
          )}
          {step === 2 && (
            <StepAlamat
              data={data}
              onChange={onChange}
              errors={errors}
              touched={touched}
              onBlur={onBlur}
            />
          )}
          {step === 3 && (
            <StepFotoKTP
              data={data}
              onChange={onChange}
              errors={errors}
              touched={touched}
              onBlur={onBlur}
            />
          )}
          {step === 4 && <StepKonfirmasi data={data} />}
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="obf-submit-error">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {submitError}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="obf-nav">
          {step > 1 && (
            <button
              type="button"
              className="obf-btn obf-btn--ghost"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Kembali
            </button>
          )}

          {step < STEPS.length ? (
            <button
              type="button"
              className={`obf-btn obf-btn--primary ${step === 1 ? "obf-btn--full" : ""}`}
              onClick={handleNext}
            >
              Lanjut
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="obf-btn obf-btn--primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="obf-spinner" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Data
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>

        {/* Step counter */}
        <p className="obf-counter">
          Langkah {step} dari {STEPS.length}
        </p>
      </div>
    </div>
  );
}
