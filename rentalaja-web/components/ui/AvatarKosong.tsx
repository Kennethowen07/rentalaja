// Foto profil kosong: siluet orang abu-abu di lingkaran. Dipakai untuk
// penyedia yang belum mengunggah foto (semua penyedia mock saat ini).

export default function AvatarKosong({ className = "size-44" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 overflow-hidden rounded-pill bg-surface-2 ${className}`}
    >
      <svg viewBox="0 0 40 40" className="size-full text-placeholder">
        <circle cx="20" cy="15.5" r="7" fill="currentColor" />
        <path d="M6 38c0-8 6.3-13 14-13s14 5 14 13z" fill="currentColor" />
      </svg>
    </span>
  );
}
