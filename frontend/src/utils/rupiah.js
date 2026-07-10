export function rupiah(n) {
  const num = Number(n)
  if (isNaN(num)) return "Rp 0"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num)
}
