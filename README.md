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
- Se nenhum filtro de texto/compasso for informado, a listagem mostra todos os hinos da tonalidade selecionada.
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


## Hospedagem (GitHub Pages)

O repositório já está preparado com workflow em `.github/workflows/deploy-pages.yml`.

1. Suba este código para o GitHub na branch `main` (ou `master`).
2. No GitHub, acesse **Settings > Pages** e configure **Build and deployment: GitHub Actions**.
3. Faça push na branch principal.
4. O workflow fará build (`npm run build`) e publicação automática da pasta `dist`.

Depois disso, a aplicação ficará disponível na URL de Pages do repositório.
