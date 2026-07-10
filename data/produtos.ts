import { Produto } from "@/lib/produto";

export const produtos: Produto[] = [
  {
    id: 1,
    nome: "Jogo de Tapetes em TPE",
    codigo: "6EA-061-500-A",
    categoria: "Proteção e Conservação",
    descricao:
      "Confeccionado com material premium, durável e antiderrapante, protege o interior do veículo contra sujeira e umidade.",
    preco: 0,
    imagem: "/acessorios/tapete-tpe.jpg",
    veiculos: ["Tera"],
  },

  {
    id: 2,
    nome: "Frisos de Porta",
    codigo: "6EA-087-012",
    categoria: "Proteção e Conservação",
    descricao:
      "Frisos laterais de proteção e design na cor do veículo.",
    preco: 0,
    imagem: "/acessorios/friso.jpg",
    veiculos: ["Tera"],
  },

  {
    id: 3,
    nome: "Rack de Teto",
    codigo: "V04-010-050",
    categoria: "Transporte e Conveniência",
    descricao:
      "Rack aerodinâmico em alumínio com chave de travamento.",
    preco: 0,
    imagem: "/acessorios/rack.jpg",
    veiculos: ["Tera"],
  },
];