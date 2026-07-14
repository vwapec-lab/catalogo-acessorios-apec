export default function Hero() {
  const dataAtual = new Date();

  const mesAno = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const mesAnoFormatado =
    mesAno.charAt(0).toUpperCase() + mesAno.slice(1);

  return (
    <section className="bg-gradient-to-br from-[#001E50] via-[#003A70] to-[#00539F] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-12 lg:grid-cols-2">

        <div>
          <span className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium">
            Grupo Apec • Volkswagen
          </span>

          <p className="mt-4 text-sm font-semibold tracking-wide text-blue-200">
            {mesAnoFormatado}
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Catálogo Oficial de
            <br />
            Acessórios Originais
            <br />
            Volkswagen
          </h2>

          <p className="mt-6 max-w-xl text-xl leading-8 text-blue-100">
            Design, proteção e funcionalidade com acessórios originais Volkswagen.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <img
            src="/hero-volkswagen.png"
            alt="Catálogo de Acessórios Volkswagen"
            className="w-full max-w-xl rounded-lg shadow-2xl"
          />
        </div>

      </div>
    </section>
  );
}