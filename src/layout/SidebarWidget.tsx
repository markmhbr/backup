import { getFotoUrl } from "../utils/image";
import { useSekolah } from "../context/SekolahContext";

export default function SidebarWidget() {
  const { sekolah } = useSekolah();
  
  if (!sekolah) return null;

  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-brand-50 px-4 py-5 text-center dark:bg-white/[0.03] border border-brand-100 dark:border-white/[0.05]`}
    >
      <div className="flex justify-center mb-3">
        {sekolah.logo ? (
          <img src={getFotoUrl(sekolah.logo)} alt="Logo" className="w-12 h-12 object-contain" />
        ) : (
          <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {sekolah.nama.charAt(0)}
          </div>
        )}
      </div>
      <h3 className="mb-1 font-bold text-gray-900 dark:text-white text-theme-sm uppercase">
        {sekolah.nama}
      </h3>
      <p className="mb-4 text-gray-500 text-xs dark:text-gray-400">
        NPSN: {sekolah.npsn}
      </p>

    </div>
  );
}
