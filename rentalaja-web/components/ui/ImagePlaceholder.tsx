// README/Fidelity: semua foto masih placeholder — kotak #EDF1EF dengan
// label 600/11px #9CA3AF. Dipakai di setiap slot foto sampai aset asli ada.
//
// role="img" + aria-label memberi kotak ini nama yang terbaca screen reader,
// menggantikan alt text foto yang belum ada (README/Accessibility).

export default function ImagePlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`grid place-items-center bg-surface text-label text-placeholder ${className}`}
    >
      {label}
    </div>
  );
}
