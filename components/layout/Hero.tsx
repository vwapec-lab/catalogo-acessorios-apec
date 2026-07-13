import Image from "next/image";

export default function Hero() {
  return (
    <section className="overflow-hidden bg-gradient-to-br from-[#001E50] via-[#003A70] to-[#00539F] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex rounded-full border border-white/30 px-4 py-2 text-sm font-medium">
            Grupo Apec • Volkswagen
          </span>

          <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Catálogo Oficial de Acessórios Originais Volkswagen
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-blue-100 md:text-lg">
  Design, proteção e funcionalidade com acessórios originais Volkswagen.
</p>
        </div>

        <div className="relative hidden h-[280px] lg:block">
          <Image
            src="/hero-volkswagen.png"
            alt="Volkswagen em destaque"
            fill
            priority
            className="object-contain object-center"
            sizes="45vw"
          />
        </div>
      </div>
    </section>
  );
}