import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logos/vw.png"
            alt="Volkswagen"
            width={48}
            height={48}
            style={{ width: "48px", height: "auto" }}
            priority
          />

          <div>
            <h1 className="text-xl font-bold text-[#001E50]">
              Catálogo Oficial de Acessórios
            </h1>

            <p className="text-sm text-slate-500">
              Grupo Apec • Volkswagen
            </p>
          </div>
        </div>

        <Image
          src="/logos/apec.png"
          alt="Grupo Apec"
          width={170}
          height={42}
          style={{ width: "170px", height: "auto" }}
          priority
        />
      </div>
    </header>
  );
}