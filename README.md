# 🎯 ManageDayzBot

**Bot Discord + Dashboard Web para gestão de clãs DayZ**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.x-5865F2)](https://discord.js.org/)
[![Express](https://img.shields.io/badge/Express-5.x-green)](https://expressjs.com/)

## ✨ Funcionalidades

### 🤖 Bot Discord
- **Clãs**: Criar, listar, alistar membros, promoções
- **Estoque**: Depositar, retirar, listar itens com auditoria
- **Frota**: Registar veículos, manutenção de peças
- **Missões**: Criar, aceitar, concluir com sistema de pontos/ranking
- **Bases**: Registar coordenadas com links para izurvive
- **IA Tática**: Análise de inteligência via Groq (LLaMA 3.3-70b)
- **IA Engenharia**: Conselhos de construção/logística via Groq
- **Mapa**: Geração de imagens táticas com Canvas

### 🌐 Dashboard Web
- Painel de comando completo via browser
- Estatísticas em tempo real
- Ações rápidas (criar clã, depositar item, etc.)
- Visualização de estoque, frota, missões, bases
- Registos de auditoria

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
echo "DISCORD_TOKEN=teu_token" > .env
echo "GROQ_API_KEY=tua_key" >> .env

# 3. Correr
npm run dev

# 4. Aceder dashboard: http://localhost:3001
```

## 📖 Comandos

### Prefixo (`!` ou `/`)
```
!cla criar <nome> [tag]     — Fundar clã
!cla listar                 — Listar clãs
!membro alistar <clã>       — Alistar-te
!membro promover <user> <patente> — Promover
!estoque guardar <qtd> <item> <local>
!estoque retirar <id>
!estoque listar
!frota guardar <veiculo> <x> <y>
!frota listar
!missao criar <desc> | <pontos>
!missao listar
!missao aceitar <id>
!missao concluir <id>
!ranking
!base salvar <nome> <x> <y>
!base listar
!intel <relato>             — Análise IA
!sugestao <pedido>          — Conselho IA
!loc <x> <y>                — Link izurvive
!dashboard                  — Link para painel web
```

### Slash Commands
Todos os comandos acima estão também disponíveis como Slash Commands nativos do Discord (`/cla`, `/estoque`, etc.)

## 🏗️ Arquitetura

```
Discord Bot ──→ API REST (Express) ←── Dashboard Web
                    │
              SQLite (arsenal_v3.db)
```

## 📁 Estrutura

| Pasta | Descrição |
|-------|-----------|
| `src/commands/` | Comandos Discord |
| `src/services/` | Lógica de negócio |
| `src/api/` | Servidor Express + Dashboard |
| `src/database/` | Schema SQLite |
| `src/types/` | Interfaces TypeScript |
| `src/sandbox/` | Experimentos |

## 🛠️ Tech Stack

- **Runtime**: Node.js + TypeScript (ESM)
- **Bot**: Discord.js v14
- **API**: Express v5
- **DB**: SQLite (sqlite3 + sqlite wrapper)
- **AI**: Groq SDK (LLaMA 3.3-70b-versatile)
- **Imagens**: Canvas (mapas táticos)
- **Frontend**: HTML + CSS + JS vanilla

## 📝 Contribuir

Lê o [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes.

## 📄 Licença

ISC
