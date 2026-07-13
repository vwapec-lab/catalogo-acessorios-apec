import Image from "next/image";
import Link from "next/link";

import { Veiculo } from "@/lib/veiculo";

interface Props {
  veiculo: Veiculo;
}

export default function VehicleCard({ veiculo }: Props) {
  return (
    <Link
      href={`/veiculo/${veiculo.slug}`}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative flex h-52 items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        {veiculo.imagem ? (
          <Image
            src={veiculo.imagem}
            alt={veiculo.nome}
            fill
            className="object-contain p-6 transition duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <span className="text-center text-lg font-bold text-[#001E50]">
            {veiculo.nome}
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-3xl font-bold text-[#001E50]">
          {veiculo.nome}
        </h3>

        <p className="mt-2 text-slate-500">
          Acessórios Originais Volkswagen
        </p>

        <div className="mt-6 flex items-center font-semibold text-[#001E50]">
          Ver acessórios

          <span className="ml-2 transition group-hover:translate-x-2">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}