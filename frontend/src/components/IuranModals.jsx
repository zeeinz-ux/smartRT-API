import { X, QrCode } from "lucide-react";
import RupiahInput from "./RupiahInput";

export function BayarModal({ show, warga, formData, onFormChange, onSubmit, onCancel, actionLoading, subtitle }) {
  if (!show || !warga) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Catat Pembayaran</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form className="modal__body" onSubmit={onSubmit}>
          <div className="text-sm text-primary fw-600 mb-md">
            {warga.nama}{subtitle ? ` — ${subtitle}` : ""}
          </div>
          <div className="form-group">
            <label>Jumlah Pembayaran</label>
            <RupiahInput value={formData.jumlah} onChange={(v) => onFormChange("jumlah", v)} required />
          </div>
          <div className="form-group">
            <label>Metode Pembayaran</label>
            <select value={formData.metode_pembayaran} onChange={(e) => onFormChange("metode_pembayaran", e.target.value)}>
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
          <div className="form-group">
            <label>Keterangan (opsional)</label>
            <input type="text" value={formData.keterangan} onChange={(e) => onFormChange("keterangan", e.target.value)} placeholder="Contoh: Bayar via WA" />
          </div>
          <div className="modal__footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary" disabled={actionLoading}>
              {actionLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function QRISModal({ show, warga, defaultJumlah, qrisImageUrl, onSubmit, onCancel, actionLoading }) {
  if (!show || !warga) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-max-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2><QrCode size={18} /> Bayar via QRIS</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="modal__body">
          <div className="qris-container">
            <div className="text-primary fw-600" style={{ fontSize: "1rem" }}>
              {warga.nama}
            </div>
            <img src={qrisImageUrl} alt="QRIS" onError={(e) => { e.target.style.display = "none"; }} />
            <p>
              Scan QRIS di atas untuk melakukan pembayaran.<br />
              Nominal: <strong>{defaultJumlah}</strong><br />
              <small className="text-muted">
                Setelah warga membayar, konfirmasi pembayaran di halaman ini
              </small>
            </p>
          </div>
        </div>
        <div className="modal__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>Tutup</button>
          <button type="button" className="btn-primary" onClick={onSubmit} disabled={actionLoading}>
            {actionLoading ? "Memproses..." : "Buat Tagihan QRIS"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditModal({ show, warga, formData, onFormChange, onSubmit, onCancel, actionLoading }) {
  if (!show || !warga) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Edit Pembayaran</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form className="modal__body" onSubmit={onSubmit}>
          <div className="text-sm text-primary fw-600 mb-md">
            {warga.nama}
          </div>
          <div className="form-group">
            <label>Jumlah</label>
            <RupiahInput value={formData.jumlah} onChange={(v) => onFormChange("jumlah", v)} required />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status} onChange={(e) => onFormChange("status", e.target.value)}>
              <option value="lunas">Lunas</option>
              <option value="pending">Pending</option>
              <option value="belum_lunas">Belum Lunas</option>
            </select>
          </div>
          <div className="form-group">
            <label>Metode Pembayaran</label>
            <select value={formData.metode_pembayaran} onChange={(e) => onFormChange("metode_pembayaran", e.target.value)}>
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
          <div className="form-group">
            <label>Keterangan</label>
            <input type="text" value={formData.keterangan} onChange={(e) => onFormChange("keterangan", e.target.value)} />
          </div>
          <div className="modal__footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary" disabled={actionLoading}>
              {actionLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteModal({ show, warga, bulan, tahun, bulanLabel, onConfirm, onCancel, actionLoading }) {
  if (!show || !warga) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Hapus Pembayaran</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="modal__body">
          <p className="text-sm text-secondary mb-md">
            Yakin ingin menghapus pembayaran <strong>{warga.nama}</strong> untuk bulan{" "}
            {bulanLabel} {tahun}?
          </p>
        </div>
        <div className="modal__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
          <button type="button" className="btn-primary btn-danger-bg" onClick={onConfirm} disabled={actionLoading}>
            {actionLoading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
