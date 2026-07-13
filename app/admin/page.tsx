"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface Modelo {
  id: string;
  nome: string;
  slug: string;
  imagem_url: string | null;
  ativo: boolean;
}

export default function AdminPage() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [nome, setNome] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [imagensEdicao, setImagensEdicao] = useState<
    Record<string, File | null>
  >({});
  const [carregando, setCarregando] = useState(false);
  const [modeloAtualizando, setModeloAtualizando] = useState<string | null>(
    null,
  );
  const [mensagem, setMensagem] = useState("");

  async function carregarModelos() {
    const { data, error } = await supabase
      .from("modelos")
      .select("id, nome, slug, imagem_url, ativo")
      .order("ordem")
      .order("nome");

    if (error) {
      setMensagem(`Erro ao carregar modelos: ${error.message}`);
      return;
    }

    setModelos(data ?? []);
  }

  useEffect(() => {
    carregarModelos();
  }, []);

  function gerarSlug(texto: string) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function enviarImagem(
    arquivo: File,
    slug: string,
  ): Promise<string> {
    const extensao =
      arquivo.name.split(".").pop()?.toLowerCase() || "png";

    const caminho = `modelos/${slug}-${Date.now()}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from("catalogo")
      .upload(caminho, arquivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro no envio da imagem: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("catalogo")
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function cadastrarModelo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!nome.trim()) {
      setMensagem("Informe o nome do modelo.");
      return;
    }

    if (!imagem) {
      setMensagem("Selecione uma imagem para o veículo.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const slug = gerarSlug(nome);
      const imagemUrl = await enviarImagem(imagem, slug);

      const { error } = await supabase.from("modelos").insert({
        nome: nome.trim(),
        slug,
        imagem_url: imagemUrl,
        ativo: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      setNome("");
      setImagem(null);
      setMensagem("Modelo cadastrado com sucesso.");

      await carregarModelos();
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao cadastrar modelo.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarImagemModelo(modelo: Modelo) {
    const arquivo = imagensEdicao[modelo.id];

    if (!arquivo) {
      setMensagem(`Selecione uma imagem para o modelo ${modelo.nome}.`);
      return;
    }

    setModeloAtualizando(modelo.id);
    setMensagem("");

    try {
      const imagemUrl = await enviarImagem(arquivo, modelo.slug);

      const { error } = await supabase
        .from("modelos")
        .update({
          imagem_url: imagemUrl,
        })
        .eq("id", modelo.id);

      if (error) {
        throw new Error(error.message);
      }

      setImagensEdicao((estadoAtual) => ({
        ...estadoAtual,
        [modelo.id]: null,
      }));

      setMensagem(`Imagem do modelo ${modelo.nome} atualizada com sucesso.`);

      await carregarModelos();
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao atualizar a imagem.",
      );
    } finally {
      setModeloAtualizando(null);
    }
  }

  async function excluirModelo(modelo: Modelo) {
    const confirmar = window.confirm(
      `Excluir o modelo ${modelo.nome}? Os acessórios vinculados também serão removidos.`,
    );

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("modelos")
      .delete()
      .eq("id", modelo.id);

    if (error) {
      setMensagem(`Erro ao excluir: ${error.message}`);
      return;
    }

    setMensagem("Modelo excluído com sucesso.");

    await carregarModelos();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#001E50]">
            Administração do catálogo
          </h1>

          <p className="mt-2 text-slate-600">
            Cadastre modelos e gerencie as imagens exibidas no catálogo.
          </p>
        </div>

        <form
          onSubmit={cadastrarModelo}
          className="mb-10 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-2xl font-bold text-[#001E50]">
            Adicionar modelo
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="nome-modelo"
                className="mb-2 block font-medium"
              >
                Nome do modelo
              </label>

              <input
                id="nome-modelo"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Ex.: Tera"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label
                htmlFor="imagem-modelo"
                className="mb-2 block font-medium"
              >
                Imagem do veículo
              </label>

              <input
                id="imagem-modelo"
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
            disabled={carregando}
            className="mt-6 rounded-xl bg-[#001E50] px-6 py-3 font-semibold text-white transition hover:bg-[#003A70] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando ? "Salvando..." : "Adicionar modelo"}
          </button>
        </form>

        {mensagem && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
            {mensagem}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-[#001E50]">
            Modelos cadastrados
          </h2>

          {modelos.length === 0 ? (
            <p className="text-slate-500">Nenhum modelo cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="grid items-center gap-5 lg:grid-cols-[140px_1fr_auto]">
                    <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {modelo.imagem_url ? (
                        <Image
                          src={modelo.imagem_url}
                          alt={modelo.nome}
                          fill
                          className="object-contain p-2"
                          sizes="140px"
                        />
                      ) : (
                        <span className="px-3 text-center text-sm font-medium text-slate-400">
                          Sem imagem
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#001E50]">
                        {modelo.nome}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        /{modelo.slug}
                      </p>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          key={modelo.imagem_url ?? modelo.id}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(evento) =>
                            setImagensEdicao((estadoAtual) => ({
                              ...estadoAtual,
                              [modelo.id]:
                                evento.target.files?.[0] ?? null,
                            }))
                          }
                          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        />

                        <button
                          type="button"
                          onClick={() => atualizarImagemModelo(modelo)}
                          disabled={modeloAtualizando === modelo.id}
                          className="whitespace-nowrap rounded-lg bg-[#001E50] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003A70] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {modeloAtualizando === modelo.id
                            ? "Enviando..."
                            : modelo.imagem_url
                              ? "Trocar imagem"
                              : "Adicionar imagem"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <a
                        href={`/admin/modelos/${modelo.id}`}
                        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        Acessórios
                      </a>

                      <button
                        type="button"
                        onClick={() => excluirModelo(modelo)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}