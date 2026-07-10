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
      <div className="flex h-52 items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
        {veiculo.slug === "vw-collection" ? (
          <div className="text-center text-xl font-bold text-[#001E50]">
            VW Collection
          </div>
        ) : (
          <Image
            src={`/veiculos/${veiculo.slug}.png`}
            alt={veiculo.nome}
            width={260}
            height={140}
            className="h-auto w-full max-w-[260px] object-contain transition duration-500 group-hover:scale-110"
          />
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