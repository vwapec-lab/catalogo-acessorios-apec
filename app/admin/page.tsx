"use client";

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
  const [carregando, setCarregando] = useState(false);
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

  async function cadastrarModelo(evento: FormEvent) {
    evento.preventDefault();

    if (!nome.trim()) {
      setMensagem("Informe o nome do modelo.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    try {
      const slug = gerarSlug(nome);
      let imagemUrl: string | null = null;

      if (imagem) {
        const extensao = imagem.name.split(".").pop()?.toLowerCase() || "png";
        const caminho = `modelos/${slug}-${Date.now()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from("catalogo")
          .upload(caminho, imagem, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Erro no envio da imagem: ${uploadError.message}`);
        }

        const { data } = supabase.storage
          .from("catalogo")
          .getPublicUrl(caminho);

        imagemUrl = data.publicUrl;
      }

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
        erro instanceof Error ? erro.message : "Erro ao cadastrar modelo.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluirModelo(modelo: Modelo) {
    const confirmar = window.confirm(
      `Excluir o modelo ${modelo.nome}? Os acessórios vinculados também serão removidos.`,
    );

    if (!confirmar) return;

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
            Cadastre e remova os modelos disponíveis no catálogo.
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
              <label className="mb-2 block font-medium">Nome do modelo</label>

              <input
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder="Ex.: Tera"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Imagem do veículo
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
            disabled={carregando}
            className="mt-6 rounded-xl bg-[#001E50] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {carregando ? "Salvando..." : "Adicionar modelo"}
          </button>

          {mensagem && (
            <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm">
              {mensagem}
            </p>
          )}
        </form>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-[#001E50]">
            Modelos cadastrados
          </h2>

          {modelos.length === 0 ? (
            <p className="text-slate-500">Nenhum modelo cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <h3 className="text-lg font-bold text-[#001E50]">
                      {modelo.nome}
                    </h3>

                    <p className="text-sm text-slate-500">/{modelo.slug}</p>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={`/admin/modelos/${modelo.id}`}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Acessórios
                    </a>

                    <button
                      type="button"
                      onClick={() => excluirModelo(modelo)}
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700"
                    >
                      Excluir
                    </button>
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