export default function SearchBar() {
  return (
    <div className="mx-auto -mt-10 max-w-5xl px-6 relative z-10">
      <div className="rounded-2xl bg-white p-3 shadow-2xl">

        <input
          type="text"
          placeholder="Pesquisar veículo, acessório ou código..."
          className="w-full rounded-xl border border-slate-200 px-5 py-4 text-lg outline-none transition focus:border-[#001E50]"
        />

      </div>
    </div>
  );
}