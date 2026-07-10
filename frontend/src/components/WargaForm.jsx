import { AlertCircle } from "lucide-react";

export default function WargaForm({ mode, formData, onChange, onSubmit, onCancel, actionLoading }) {
  if (mode === "add") {
    return (
      <form className="modal__body" onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Nama Lengkap *</label>
            <input type="text" value={formData.nama} onChange={(e) => onChange("nama", e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={formData.email} onChange={(e) => onChange("email", e.target.value)} required />
          </div>
          <div className="form-group">
            <label>No. HP *</label>
            <input type="tel" value={formData.no_hp} onChange={(e) => onChange("no_hp", e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" value={formData.password} onChange={(e) => onChange("password", e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={formData.role} onChange={(e) => onChange("role", e.target.value)}>
              <option value="warga">Warga</option>
              <option value="bendahara">Bendahara</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {formData.role === "warga" ? (
          <div className="form-info">
            <AlertCircle size={16} />
            <span>Warga akan login dan mengisi data lengkap (NIK, KK, alamat, foto KTP) melalui form onboarding. Admin kemudian memverifikasi data tersebut.</span>
          </div>
        ) : (
          <div className="form-info">
            <AlertCircle size={16} />
            <span>Akun {formData.role} akan langsung aktif tanpa perlu onboarding.</span>
          </div>
        )}
        <div className="modal__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
          <button type="submit" className="btn-primary" disabled={actionLoading}>
            {actionLoading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="modal__body" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Nama</label>
          <input type="text" value={formData.nama} onChange={(e) => onChange("nama", e.target.value)} />
        </div>
        <div className="form-group">
          <label>No. HP</label>
          <input type="tel" value={formData.no_hp} onChange={(e) => onChange("no_hp", e.target.value)} />
        </div>
        <div className="form-group form-group--full">
          <label>Alamat</label>
          <input type="text" value={formData.alamat} onChange={(e) => onChange("alamat", e.target.value)} />
        </div>
        <div className="form-group">
          <label>No. Rumah</label>
          <input type="text" value={formData.no_rumah} onChange={(e) => onChange("no_rumah", e.target.value)} />
        </div>
        <div className="form-group">
          <label>Status Huni</label>
          <select value={formData.status_huni} onChange={(e) => onChange("status_huni", e.target.value)}>
            <option value="">Pilih...</option>
            <option value="pemilik">Pemilik</option>
            <option value="penyewa">Penyewa</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status Akun</label>
          <select value={formData.user_status} onChange={(e) => onChange("user_status", e.target.value)}>
            <option value="">Pilih...</option>
            <option value="active">Aktif</option>
            <option value="suspended">Nonaktif</option>
          </select>
        </div>
      </div>
      <div className="modal__footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
        <button type="submit" className="btn-primary" disabled={actionLoading}>
          {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
