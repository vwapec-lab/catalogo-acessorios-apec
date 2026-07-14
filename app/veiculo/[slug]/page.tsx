import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { supabase } from "@/lib/supabase";

interface PaginaVeiculoProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Modelo {
  id: string;
  nome: string;
  slug: string;
  imagem_url: string | null;
  banner_url: string | null;
}

interface Acessorio {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  ativo: boolean;
  ordem: number;
  categorias:
    | {
        nome: string;
      }
    | {
        nome: string;
      }[]
    | null;
}

function obterNomeCategoria(acessorio: Acessorio) {
  if (!acessorio.categorias) {
    return "Outros acessórios";
  }

  if (Array.isArray(acessorio.categorias)) {
    return acessorio.categorias[0]?.nome ?? "Outros acessórios";
  }

  return acessorio.categorias.nome;
}

function formatarPreco(preco: number | null) {
  if (preco === null) {
    return "Consulte preço e disponibilidade";
  }

  return Number(preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function PaginaVeiculo({
  params,
}: PaginaVeiculoProps) {
  const { slug } = await params;
  const dataAtual = new Date();

const mesAno = dataAtual.toLocaleDateString("pt-BR", {
  month: "long",
  year: "numeric",
});

const mesAnoFormatado =
  mesAno.charAt(0).toUpperCase() + mesAno.slice(1);

  const { data: modeloData, error: modeloError } = await supabase
    .from("modelos")
    .select("id, nome, slug, imagem_url, banner_url")
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (modeloError) {
    throw new Error(`Erro ao carregar o modelo: ${modeloError.message}`);
  }

  if (!modeloData) {
    notFound();
  }

  const modelo = modeloData as Modelo;

  const { data: acessoriosData, error: acessoriosError } = await supabase
    .from("acessorios")
    .select(`
      id,
      nome,
      codigo,
      descricao,
      preco,
      imagem_url,
      ativo,
      ordem,
      categorias (
        nome
      )
    `)
    .eq("modelo_id", modelo.id)
    .eq("ativo", true)
    .order("ordem")
    .order("nome");

  if (acessoriosError) {
    throw new Error(
      `Erro ao carregar os acessórios: ${acessoriosError.message}`,
    );
  }

  const acessorios = (acessoriosData ?? []) as Acessorio[];

  const categorias = Array.from(
    new Set(acessorios.map((acessorio) => obterNomeCategoria(acessorio))),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-semibold text-[#001E50] transition hover:opacity-70"
          >
            ← Voltar ao catálogo
          </Link>

          <span className="text-sm text-slate-500">
            Grupo Apec • Volkswagen
          </span>
        </div>
      </header>

      <section className="overflow-hidden bg-gradient-to-br from-[#001E50] to-[#00539F] text-white">
        <div className="mx-auto grid min-h-[390px] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-3">
  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">
    Acessórios Originais Volkswagen
  </p>

  <span className="rounded-full border border-white/30 px-3 py-1 text-sm font-semibold text-blue-100">
    {mesAnoFormatado}
  </span>
</div>

            <h1 className="mt-4 text-5xl font-bold md:text-6xl">
              {modelo.nome}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-blue-100">
              Explore os acessórios disponíveis para personalizar, proteger e
              ampliar a funcionalidade do seu Volkswagen.
            </p>
          </div>

          {modelo.imagem_url && (
            <div className="flex justify-center">
              <div className="relative h-[300px] w-full max-w-[600px] overflow-hidden rounded-3xl bg-white">
                <Image
                  src={modelo.imagem_url}
                  alt={modelo.nome}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-[#001E50]">
            Acessórios disponíveis
          </h2>

          <p className="mt-3 text-slate-600">
            Consulte as opções cadastradas para o modelo {modelo.nome}.
          </p>
        </div>

        {categorias.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-3">
            {categorias.map((categoria) => (
              <span
                key={categoria}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[#001E50]"
              >
                {categoria}
              </span>
            ))}
          </div>
        )}

        {acessorios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <h3 className="text-2xl font-bold text-[#001E50]">
              Catálogo em atualização
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Ainda não existem acessórios cadastrados para este modelo.
              Consulte nossa equipe para verificar disponibilidade.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {acessorios.map((acessorio) => (
              <article
                key={acessorio.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative flex h-64 items-center justify-center bg-slate-100">
                  {acessorio.imagem_url ? (
                    <Image
                      src={acessorio.imagem_url}
                      alt={acessorio.nome}
                      fill
                      className="object-contain p-5"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-400">
                      Imagem não cadastrada
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <p className="text-sm font-semibold text-blue-700">
                    {obterNomeCategoria(acessorio)}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-[#001E50]">
                    {acessorio.nome}
                  </h3>

                  {acessorio.codigo && (
                    <p className="mt-2 text-sm text-slate-500">
                      Código: {acessorio.codigo}
                    </p>
                  )}

                  {acessorio.descricao && (
                    <p className="mt-4 line-clamp-4 leading-7 text-slate-600">
                      {acessorio.descricao}
                    </p>
                  )}

                  <p className="mt-6 text-xl font-bold text-[#001E50]">
                    {formatarPreco(acessorio.preco)}
                  </p>

                  <p className="mt-3 text-sm text-slate-500">
                    Produto sujeito à disponibilidade de estoque.
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}