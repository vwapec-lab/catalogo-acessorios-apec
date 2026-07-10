import Header from "@/components/layout/Header";
import Hero from "@/components/layout/Hero";
import SearchBar from "@/components/ui/SearchBar";
import VehicleCard from "@/components/vehicles/VehicleCard";

import { supabase } from "@/lib/supabase";
import { Veiculo } from "@/lib/veiculo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("modelos")
    .select("id, nome, slug, imagem_url, banner_url")
    .eq("ativo", true)
    .order("ordem")
    .order("nome");

  if (error) {
    throw new Error(`Erro ao carregar os modelos: ${error.message}`);
  }

  const veiculos: Veiculo[] = (data ?? []).map((modelo) => ({
    id: modelo.id,
    nome: modelo.nome,
    slug: modelo.slug,
    imagem: modelo.imagem_url ?? "",
    banner: modelo.banner_url ?? "",
  }));

  return (
    <main className="min-h-screen bg-slate-100">
      <Header />

      <Hero />

      <SearchBar />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-[#001E50]">
            Escolha seu Volkswagen
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Selecione um modelo para visualizar os acessórios originais
            disponíveis.
          </p>
        </div>

        {veiculos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h3 className="text-2xl font-bold text-[#001E50]">
              Catálogo em atualização
            </h3>

            <p className="mt-3 text-slate-600">
              Nenhum modelo está disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {veiculos.map((veiculo) => (
              <VehicleCard key={veiculo.id} veiculo={veiculo} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}