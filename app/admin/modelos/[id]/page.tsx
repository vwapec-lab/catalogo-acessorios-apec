"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

interface Modelo {
  id: string;
  nome: string;
  slug: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Acessorio {
  id: string;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  ativo: boolean;
  categorias:
    | {
        nome: string;
      }
    | {
        nome: string;
      }[]
    | null;
}

export default function AdminModeloPage() {
  const params = useParams<{ id: string }>();
  const modeloId = params.id;

  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [acessorios, setAcessorios] = useState<Acessorio[]>([]);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setMensagem("");

    const { data: modeloData, error: modeloError } = await supabase
      .from("modelos")
      .select("id, nome, slug")
      .eq("id", modeloId)
      .single();

    if (modeloError) {
      setMensagem(`Erro ao carregar modelo: ${modeloError.message}`);
      setCarregando(false);
      return;
    }

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
        categorias (
          nome
        )
      `)
      .eq("modelo_id", modeloId)
      .order("ordem")
      .order("nome");

    if (acessoriosError) {
      setMensagem(
        `Erro ao carregar acessórios: ${acessoriosError.message}`,
      );
      setCarregando(false);
      return;
    }

    setModelo(modeloData);
    setAcessorios((acessoriosData ?? []) as Acessorio[]);
    setCarregando(false);
  }, [modeloId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function limparFormulario() {
    setNome("");
    setCodigo("");
    setCategoria("");
    setDescricao("");
    setPreco("");
    setImagem(null);
  }

  async function buscarOuCriarCategoria(
    nomeCategoria: string,
  ): Promise<Categoria> {
    const nomeLimpo = nomeCategoria.trim();

    const { data: categoriaExistente, error: buscaError } = await supabase
      .from("categorias")
      .select("id, nome")
      .ilike("nome", nomeLimpo)
      .maybeSingle();

    if (buscaError) {
      throw new Error(
        `Erro ao verificar categoria: ${buscaError.message}`,
      );
    }

    if (categoriaExistente) {
      return categoriaExistente;
    }

    const { data: novaCategoria, error: categoriaError } = await supabase
      .from("categorias")
      .insert({
        nome: nomeLimpo,
        ativo: true,
      })
      .select("id, nome")
      .single();

    if (categoriaError) {
      throw new Error(
        `Erro ao cadastrar categoria: ${categoriaError.message}`,
      );
    }

    return novaCategoria;
  }

  async function cadastrarAcessorio(evento: FormEvent) {
    evento.preventDefault();

    if (!nome.trim()) {
      setMensagem("Informe o nome do acessório.");
      return;
    }

    if (!categoria.trim()) {
      setMensagem("Informe a categoria.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      const categoriaSelecionada =
        await buscarOuCriarCategoria(categoria);

      let imagemUrl: string | null = null;

      if (imagem) {
        const extensao =
          imagem.name.split(".").pop()?.toLowerCase() || "png";

        const nomeSeguro = nome
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        const caminho =
          `acessorios/${modelo?.slug ?? modeloId}/` +
          `${nomeSeguro}-${Date.now()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from("catalogo")
          .upload(caminho, imagem, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Erro no envio da imagem: ${uploadError.message}`,
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("catalogo")
          .getPublicUrl(caminho);

        imagemUrl = publicUrlData.publicUrl;
      }

      const precoNumerico = preco
        ? Number(preco.replace(",", "."))
        : null;

      if (
        preco &&
        (precoNumerico === null || Number.isNaN(precoNumerico))
      ) {
        throw new Error("Informe um preço válido.");
      }

      const { error } = await supabase.from("acessorios").insert({
        modelo_id: modeloId,
        categoria_id: categoriaSelecionada.id,
        nome: nome.trim(),
        codigo: codigo.trim() || null,
        descricao: descricao.trim() || null,
        preco: precoNumerico,
        imagem_url: imagemUrl,
        ativo: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      limparFormulario();
      setMensagem("Acessório cadastrado com sucesso.");
      await carregarDados();
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao cadastrar acessório.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAcessorio(acessorio: Acessorio) {
    const confirmar = window.confirm(
      `Excluir o acessório "${acessorio.nome}"?`,
    );

    if (!confirmar) return;

    setMensagem("");

    const { error } = await supabase
      .from("acessorios")
      .delete()
      .eq("id", acessorio.id);

    if (error) {
      setMensagem(`Erro ao excluir acessório: ${error.message}`);
      return;
    }

    setMensagem("Acessório excluído com sucesso.");
    await carregarDados();
  }

  function obterNomeCategoria(acessorio: Acessorio) {
    if (!acessorio.categorias) {
      return "Sem categoria";
    }

    if (Array.isArray(acessorio.categorias)) {
      return acessorio.categorias[0]?.nome ?? "Sem categoria";
    }

    return acessorio.categorias.nome;
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-slate-600">Carregando...</p>
      </main>
    );
  }

  if (!modelo) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-red-700">
          Modelo não encontrado.
        </p>

        <Link
          href="/admin"
          className="mt-4 inline-block font-semibold text-blue-700"
        >
          ← Voltar ao painel
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="font-semibold text-[#001E50] hover:underline"
        >
          ← Voltar aos modelos
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Administração do catálogo
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#001E50]">
            {modelo.nome}
          </h1>

          <p className="mt-2 text-slate-600">
            Cadastre e remova os acessórios vinculados a este modelo.
          </p>
        </div>

        <form
          onSubmit={cadastrarAcessorio}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-2xl font-bold text-[#001E50]">
            Adicionar acessório
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Nome do acessório
              </label>

              <input
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Ex.: Jogo de Tapetes em TPE"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Código
              </label>

              <input
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value)}
                placeholder="Ex.: 6EA-061-500-A"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Categoria
              </label>

              <input
                value={categoria}
                onChange={(evento) =>
                  setCategoria(evento.target.value)
                }
                placeholder="Ex.: Proteção e Conservação"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Preço
              </label>

              <input
                value={preco}
                onChange={(evento) => setPreco(evento.target.value)}
                placeholder="Ex.: 489,90"
                inputMode="decimal"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">
                Descrição
              </label>

              <textarea
                value={descricao}
                onChange={(evento) =>
                  setDescricao(evento.target.value)
                }
                placeholder="Informe a descrição do acessório."
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">
                Imagem do acessório
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(evento) =>
                  setImagem(evento.target.files?.[0] ?? null)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="mt-6 rounded-xl bg-[#001E50] px-6 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50"
          >
            {salvando
              ? "Salvando..."
              : "Adicionar acessório"}
          </button>

          {mensagem && (
            <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm">
              {mensagem}
            </p>
          )}
        </form>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#001E50]">
              Acessórios cadastrados
            </h2>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              {acessorios.length}
            </span>
          </div>

          {acessorios.length === 0 ? (
            <p className="text-slate-500">
              Nenhum acessório cadastrado para este modelo.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {acessorios.map((acessorio) => (
                <article
                  key={acessorio.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="relative flex h-52 items-center justify-center bg-slate-100">
                    {acessorio.imagem_url ? (
                      <Image
                        src={acessorio.imagem_url}
                        alt={acessorio.nome}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <span className="text-sm text-slate-400">
                        Sem imagem
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-sm font-semibold text-blue-700">
                      {obterNomeCategoria(acessorio)}
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-[#001E50]">
                      {acessorio.nome}
                    </h3>

                    {acessorio.codigo && (
                      <p className="mt-2 text-sm text-slate-500">
                        Código: {acessorio.codigo}
                      </p>
                    )}

                    {acessorio.preco !== null && (
                      <p className="mt-4 text-xl font-bold text-[#001E50]">
                        {Number(acessorio.preco).toLocaleString(
                          "pt-BR",
                          {
                            style: "currency",
                            currency: "BRL",
                          },
                        )}
                      </p>
                    )}

                    <div className="mt-5 flex gap-3">
  <Link
    href={`/admin/acessorios/${acessorio.id}`}
    className="flex-1 rounded-lg bg-[#001E50] px-4 py-2 text-center font-semibold text-white transition hover:bg-blue-900"
  >
    Editar
  </Link>

  <button
    type="button"
    onClick={() => excluirAcessorio(acessorio)}
    className="flex-1 rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50"
  >
    Excluir
  </button>
</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}