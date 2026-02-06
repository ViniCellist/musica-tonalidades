# Busca de Hinos por Tonalidade

Aplicação web **frontend-only** para buscar hinos musicais em JSONs locais por tonalidade.

## Rodando o projeto

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Comportamento de busca

- Filtros opcionais e combináveis.
- Número do hino: busca parcial.
- Título: case-insensitive e sem acentos.
- Lista ordenada por número crescente.
- Dropdown de compasso mostra somente opções existentes nos hinos da tonalidade carregada.
- Se tonalidade não tiver JSON mapeado, mostra "Tonalidade ainda não cadastrada" sem quebrar a app.

## Adicionando novos dados

1. Coloque a partitura em `/images` (png/jpg/jpeg/pdf).
2. Coloque/edite o JSON correspondente em `/json`.
3. Atualize o mapeamento em `app.js` no array `KEY_STEPS` para vincular a tonalidade ao arquivo JSON.

Formato de item no JSON:

```json
{
  "numero": 39,
  "titulo": "Eu desejo, Senhor",
  "compasso": "3/4",
  "interpretacao": null,
  "andamento": { "minimo": 60, "maximo": 72 },
  "partitura": { "tipo": "png", "arquivo": "039.png" }
}
```
