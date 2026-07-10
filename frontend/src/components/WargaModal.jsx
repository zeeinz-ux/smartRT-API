import { X, Eye, CheckCircle2, XCircle, Clock, Home, Phone, Mail, Shield, UserCheck, FileText, AlertCircle, Plus, Edit3 } from "lucide-react";
import { formatDate } from "../utils/formatDate.js";
import WargaForm from "./WargaForm.jsx";

export function DetailModal({ warga, actionLoading, onVerify, onReject, onClose }) {
  if (!warga) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Detail Warga</h2>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal__body">
          <div className="detail-grid">
            <div className="detail-item">
              <label><UserCheck size={16} /> Nama</label>
              <span>{warga.nama || "-"}</span>
            </div>
            <div className="detail-item">
              <label><Mail size={16} /> Email</label>
              <span>{warga.email || "-"}</span>
            </div>
            <div className="detail-item">
              <label><Phone size={16} /> No. HP</label>
              <span>{warga.no_hp || "-"}</span>
            </div>
            <div className="detail-item">
              <label><Shield size={16} /> Role</label>
              <span className="ad-badge ad-badge--role">{warga.role}</span>
            </div>
            <div className="detail-item">
              <label><FileText size={16} /> NIK</label>
              <span>{warga.nik || "-"}</span>
            </div>
            <div className="detail-item">
              <label><Home size={16} /> Alamat</label>
              <span>{warga.alamat ? `${warga.alamat}, No. ${warga.no_rumah || "-"}` : "-"}</span>
            </div>
            <div className="detail-item">
              <label><Home size={16} /> Status Huni</label>
              <span>{warga.status_huni || "-"}</span>
            </div>
            <div className="detail-item">
              <label><Clock size={16} /> Bergabung</label>
              <span>{warga.created_at ? formatDate(warga.created_at) : "-"}</span>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          {warga.verification_status === "pending" && (
            <>
              <button className="btn-success" onClick={() => onVerify(warga.profile_id)} disabled={actionLoading}>
                <CheckCircle2 size={16} /> Verifikasi
              </button>
              <button className="btn-danger" onClick={() => onReject(warga)} disabled={actionLoading}>
                <XCircle size={16} /> Tolak
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

export function AddModal({ show, formData, onChange, onSubmit, onCancel, actionLoading }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2><Plus size={20} /> Tambah Warga</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <WargaForm mode="add" formData={formData} onChange={onChange} onSubmit={onSubmit} onCancel={onCancel} actionLoading={actionLoading} />
      </div>
    </div>
  );
}

export function EditModal({ show, formData, onChange, onSubmit, onCancel, actionLoading }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2><Edit3 size={20} /> Edit Warga</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <WargaForm mode="edit" formData={formData} onChange={onChange} onSubmit={onSubmit} onCancel={onCancel} actionLoading={actionLoading} />
      </div>
    </div>
  );
}

export function RejectModal({ show, reason, onReasonChange, onConfirm, onCancel, actionLoading }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2><XCircle size={20} /> Verifikasi Ditolak</h2>
          <button className="modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="modal__body">
          <div className="form-group">
            <label>Alasan Penolakan</label>
            <textarea value={reason} onChange={(e) => onReasonChange(e.target.value)} rows={4} placeholder="Masukkan alasan penolakan..." />
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn-secondary" onClick={onCancel}>Batal</button>
          <button className="btn-danger" onClick={onConfirm} disabled={actionLoading || !reason.trim()}>
            {actionLoading ? "Memproses..." : "Tolak"}
          </button>
        </div>
      </div>
    </div>
  );
}
