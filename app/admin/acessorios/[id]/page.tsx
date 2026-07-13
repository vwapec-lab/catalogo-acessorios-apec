"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

interface Acessorio {
  id: string;
  modelo_id: string;
  categoria_id: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  ativo: boolean;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function EditarAcessorioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const acessorioId = params.id;

  const [acessorio, setAcessorio] = useState<Acessorio | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [ativo, setAtivo] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setMensagem("");

    const { data: acessorioData, error: acessorioError } = await supabase
      .from("acessorios")
      .select(`
        id,
        modelo_id,
        categoria_id,
        nome,
        codigo,
        descricao,
        preco,
        imagem_url,
        ativo
      `)
      .eq("id", acessorioId)
      .maybeSingle();

    if (acessorioError) {
      setMensagem(
        `Erro ao carregar acessório: ${acessorioError.message}`,
      );
      setCarregando(false);
      return;
    }

    if (!acessorioData) {
      setMensagem("Acessório não encontrado.");
      setCarregando(false);
      return;
    }

    const { data: categoriasData, error: categoriasError } = await supabase
      .from("categorias")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome");

    if (categoriasError) {
      setMensagem(
        `Erro ao carregar categorias: ${categoriasError.message}`,
      );
      setCarregando(false);
      return;
    }

    const dados = acessorioData as Acessorio;

    setAcessorio(dados);
    setCategorias(categoriasData ?? []);
    setNome(dados.nome);
    setCodigo(dados.codigo ?? "");
    setCategoriaId(dados.categoria_id ?? "");
    setDescricao(dados.descricao ?? "");
    setPreco(
      dados.preco === null
        ? ""
        : String(dados.preco).replace(".", ","),
    );
    setAtivo(dados.ativo);
    setCarregando(false);
  }, [acessorioId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function enviarImagem(): Promise<string | null> {
    if (!imagem || !acessorio) {
      return acessorio?.imagem_url ?? null;
    }

    const extensao =
      imagem.name.split(".").pop()?.toLowerCase() || "png";

    const nomeSeguro = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const caminho =
      `acessorios/${acessorio.modelo_id}/` +
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

    const { data } = supabase.storage
      .from("catalogo")
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function salvarAlteracoes(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!acessorio) {
      return;
    }

    if (!nome.trim()) {
      setMensagem("Informe o nome do acessório.");
      return;
    }

    if (!categoriaId) {
      setMensagem("Selecione uma categoria.");
      return;
    }

    const precoNumerico = preco
      ? Number(preco.replace(",", "."))
      : null;

    if (preco && Number.isNaN(precoNumerico)) {
      setMensagem("Informe um preço válido.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    try {
      const imagemUrl = await enviarImagem();

      const { error } = await supabase
        .from("acessorios")
        .update({
          nome: nome.trim(),
          codigo: codigo.trim() || null,
          categoria_id: categoriaId,
          descricao: descricao.trim() || null,
          preco: precoNumerico,
          imagem_url: imagemUrl,
          ativo,
        })
        .eq("id", acessorio.id);

      if (error) {
        throw new Error(error.message);
      }

      setMensagem("Acessório atualizado com sucesso.");
      setImagem(null);

      setTimeout(() => {
        router.push(`/admin/modelos/${acessorio.modelo_id}`);
        router.refresh();
      }, 700);
    } catch (erro) {
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Erro ao atualizar o acessório.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-slate-600">Carregando...</p>
      </main>
    );
  }

  if (!acessorio) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p className="text-red-700">
          {mensagem || "Acessório não encontrado."}
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
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/admin/modelos/${acessorio.modelo_id}`}
          className="font-semibold text-[#001E50] hover:underline"
        >
          ← Voltar aos acessórios
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Administração do catálogo
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#001E50]">
            Editar acessório
          </h1>

          <p className="mt-2 text-slate-600">
            Atualize os dados e a imagem do acessório.
          </p>
        </div>

        <form
          onSubmit={salvarAlteracoes}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          {acessorio.imagem_url && (
            <div className="mb-6">
              <p className="mb-2 font-medium text-slate-700">
                Imagem atual
              </p>

              <div className="relative h-64 overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src={acessorio.imagem_url}
                  alt={acessorio.nome}
                  fill
                  className="object-contain p-4"
                  sizes="800px"
                />
              </div>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium">
                Nome do acessório
              </label>

              <input
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Categoria
              </label>

              <select
                value={categoriaId}
                onChange={(evento) => setCategoriaId(evento.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-700"
              >
                <option value="">Selecione</option>

                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Preço
              </label>

              <input
                value={preco}
                onChange={(evento) => setPreco(evento.target.value)}
                inputMode="decimal"
                placeholder="Ex.: 599,00"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">
                Descrição
              </label>

              <textarea
                value={descricao}
                onChange={(evento) => setDescricao(evento.target.value)}
                rows={4}
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block font-medium">
                Trocar imagem
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(evento) =>
                  setImagem(evento.target.files?.[0] ?? null)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              />

              <p className="mt-2 text-sm text-slate-500">
                Deixe vazio para manter a imagem atual.
              </p>
            </div>

            <label className="flex items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(evento) => setAtivo(evento.target.checked)}
                className="h-4 w-4"
              />

              <span className="font-medium text-slate-700">
                Acessório ativo no catálogo
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="mt-6 rounded-xl bg-[#001E50] px-6 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>

          {mensagem && (
            <p className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm">
              {mensagem}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}