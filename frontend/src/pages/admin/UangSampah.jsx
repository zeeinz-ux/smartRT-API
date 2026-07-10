import { useState, useEffect, useCallback } from "react";
import { rupiah } from "../../utils/rupiah.js";
import { formatDate } from "../../utils/formatDate.js";
import "../../assets/style/css/UangSampah.css";
import API_BASE_URL from "../../utils/api.js";
import { BULAN_TANPA_SEMUA as BULAN } from "../../utils/bulan.js";
import { BayarModal, QRISModal, EditModal, DeleteModal } from "../../components/IuranModals.jsx";
import IuranStats from "../../components/IuranStats.jsx";
import IuranTable from "../../components/IuranTable.jsx";

export default function UangSampah() {
  const now = new Date();
  const [bulan, setBulan] = useState(() => { const s = localStorage.getItem('usBulan'); return s ? Number(s) : now.getMonth() + 1; });
  const [tahun, setTahun] = useState(() => { const s = localStorage.getItem('usTahun'); return s ? Number(s) : now.getFullYear(); });
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, lunas: 0, pending: 0, belumLunas: 0, totalAmount: 0, collectedAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [toast, setToast] = useState(null);

  // Modal states
  const [showBayarModal, setShowBayarModal] = useState(false);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [defaultJumlah, setDefaultJumlah] = useState(150000);
  const [formBayar, setFormBayar] = useState({
    jumlah: 150000,
    metode_pembayaran: "tunai",
    keterangan: "",
  });

  const [formEdit, setFormEdit] = useState({
    jumlah: 0,
    status: "lunas",
    metode_pembayaran: "tunai",
    keterangan: "",
  });

  const QRIS_IMAGE_URL = import.meta.env.VITE_QRIS_IMAGE_URL || `${API_BASE_URL}/images/qris.png`;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        bulan: bulan.toString(),
        tahun: tahun.toString(),
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`${API_BASE_URL}/api/admin/sampah?${params}`, { credentials: "include" });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setStats(json.stats);
        setPagination((prev) => ({ ...prev, ...json.pagination }));
      }
    } catch {
      showToast("Gagal memuat data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [bulan, tahun, pagination.page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem('usBulan', String(bulan));
    localStorage.setItem('usTahun', String(tahun));
  }, [bulan, tahun]);

  const handlePrevMonth = () => {
    if (bulan === 1) { setBulan(12); setTahun((t) => t - 1); }
    else { setBulan((b) => b - 1); }
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleNextMonth = () => {
    if (bulan === 12) { setBulan(1); setTahun((t) => t + 1); }
    else { setBulan((b) => b + 1); }
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openBayarModal = (warga) => {
    setSelectedWarga(warga);
    setFormBayar({ jumlah: defaultJumlah, metode_pembayaran: "tunai", keterangan: "" });
    setShowBayarModal(true);
  };

  const openQRISModal = (warga) => {
    setSelectedWarga(warga);
    setShowQRISModal(true);
  };

  const handleBayarViaQRIS = async () => {
    if (!selectedWarga) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sampah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          warga_id: selectedWarga.warga_id,
          bulan,
          tahun,
          jumlah: defaultJumlah,
          status: "pending",
          metode_pembayaran: "qris",
          keterangan: "Pembayaran via QRIS",
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Tagihan QRIS berhasil dibuat. Warga dapat melakukan pembayaran.");
        setShowQRISModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal membuat tagihan", "error");
      }
    } catch {
      showToast("Gagal membuat tagihan", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBayar = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sampah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          warga_id: selectedWarga.warga_id,
          bulan,
          tahun,
          jumlah: formBayar.jumlah,
          status: "lunas",
          metode_pembayaran: formBayar.metode_pembayaran,
          keterangan: formBayar.keterangan,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Pembayaran ${selectedWarga.nama} berhasil dicatat`);
        setShowBayarModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal mencatat pembayaran", "error");
      }
    } catch {
      showToast("Gagal mencatat pembayaran", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (warga) => {
    setSelectedWarga(warga);
    setSelectedPayment(warga.pembayaran);
    setFormEdit({
      jumlah: warga.pembayaran?.jumlah || defaultJumlah,
      status: warga.pembayaran?.status || "lunas",
      metode_pembayaran: warga.pembayaran?.metode_pembayaran || "tunai",
      keterangan: warga.pembayaran?.keterangan || "",
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sampah/${selectedPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formEdit),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Pembayaran berhasil diupdate");
        setShowEditModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal mengupdate", "error");
      }
    } catch {
      showToast("Gagal mengupdate pembayaran", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (warga) => {
    setSelectedWarga(warga);
    setSelectedPayment(warga.pembayaran);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sampah/${selectedPayment.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();
      if (json.success) {
        showToast("Pembayaran berhasil dihapus");
        setShowDeleteModal(false);
        fetchData();
      } else {
        showToast(json.message || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Gagal menghapus pembayaran", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aPaid = a.pembayaran?.status === "lunas";
    const bPaid = b.pembayaran?.status === "lunas";
    return aPaid - bPaid;
  });

  return (
    <div className="uang-sampah">
      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.message}</div>
      )}

      <IuranTable
        title="Uang Sampah"
        subtitle="Kelola iuran kebersihan bulanan warga RT 003"
        bulan={bulan}
        tahun={tahun}
        BULAN={BULAN}
        now={now}
        search={search}
        statusFilter={statusFilter}
        pagination={pagination}
        sortedData={sortedData}
        isLoading={isLoading}
        defaultJumlah={defaultJumlah}
        formatDate={formatDate}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onBulanChange={setBulan}
        onTahunChange={setTahun}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        openBayarModal={openBayarModal}
        openQRISModal={openQRISModal}
        openEditModal={openEditModal}
        openDeleteModal={openDeleteModal}
      />

      <IuranStats stats={stats} />

      <BayarModal
        show={showBayarModal}
        warga={selectedWarga}
        formData={formBayar}
        onFormChange={(field, value) => setFormBayar((prev) => ({ ...prev, [field]: value }) )}
        onSubmit={handleBayar}
        onCancel={() => setShowBayarModal(false)}
        actionLoading={actionLoading}
      />

      <QRISModal
        show={showQRISModal}
        warga={selectedWarga}
        defaultJumlah={rupiah(defaultJumlah)}
        qrisImageUrl={QRIS_IMAGE_URL}
        onSubmit={handleBayarViaQRIS}
        onCancel={() => setShowQRISModal(false)}
        actionLoading={actionLoading}
      />

      <EditModal
        show={showEditModal}
        warga={selectedWarga}
        formData={formEdit}
        onFormChange={(field, value) => setFormEdit((prev) => ({ ...prev, [field]: value }) )}
        onSubmit={handleEdit}
        onCancel={() => setShowEditModal(false)}
        actionLoading={actionLoading}
      />

      <DeleteModal
        show={showDeleteModal}
        warga={selectedWarga}
        bulan={bulan}
        tahun={tahun}
        bulanLabel={BULAN.find((b) => b.value === bulan)?.label}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        actionLoading={actionLoading}
      />
    </div>
  );
}
