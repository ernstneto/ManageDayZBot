# 🎯 Guia de Contribuição — ManageDayzBot

Bem-vindo ao projeto! Este é um bot Discord + Dashboard Web para gestão de clãs DayZ.

## 🏗️ Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Discord Bot │────→│  API Layer   │←────│  Web Dashboard│
│  (prefix +   │     │  (Express)   │     │  (HTML/JS)   │
│   slash)     │     │              │     │              │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │  arsenal_v3  │
                    │   (SQLite)   │
                    └──────────────┘
```

## 🚀 Setup Local

### 1. Clonar e instalar
```bash
git clone <repo-url>
cd ManageDayzBot
npm install
```

### 2. Configurar ambiente
Cria um ficheiro `.env` na raiz:
```env
DISCORD_TOKEN=teu_token_aqui
GROQ_API_KEY=tua_key_groq_aqui
API_PORT=3001
```

### 3. Correr em desenvolvimento
```bash
# Terminal 1: Bot Discord + API + Dashboard
npm run dev

# Aceder ao dashboard: http://localhost:3001
```

### 4. Build para produção
```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── index.ts              # Entry point (bot + API)
├── database/
│   └── connection.ts     # SQLite schema + init
├── types/
│   └── index.ts          # Interfaces TypeScript
├── commands/             # Comandos Discord (prefix ! e /)
│   ├── cla.ts            # Gestão de clãs
│   ├── membro.ts         # Alistamento/promoção
│   ├── estoque.ts        # Inventário
│   ├── frota.ts          # Veículos
│   ├── missao.ts         # Missões + ranking
│   ├── base.ts           # Bases no mapa
│   ├── intel.ts          # IA tática (Groq)
│   ├── sugestao.ts       # IA engenharia (Groq)
│   ├── loc.ts            # Links izurvive
│   └── arquitetura.ts    # Captura de mapa (puppeteer)
├── services/             # Lógica de negócio (reutilizável)
│   ├── claService.ts
│   ├── membroService.ts
│   ├── estoqueService.ts
│   ├── fleetService.ts
│   ├── missionService.ts
│   ├── groqService.ts
│   └── mapServices.ts
├── api/
│   ├── integrated-server.ts  # Express server
│   ├── types.ts              # API types
│   └── public/               # Dashboard web
│       ├── index.html
│       ├── style.css
│       └── app.js
├── sandbox/              # Testes/experimentos
└── testes/               # Testes unitários
```

## 🛠️ Como Contribuir

### Adicionar um novo comando Discord

1. Cria o ficheiro em `src/commands/meu-comando.ts`:
```typescript
import { Message } from "discord.js";

export async function executeMeuComando(message: Message, args: string[]) {
    // Lógica aqui
    await message.reply("Resultado!");
}
```

2. Regista em `src/index.ts`:
```typescript
import { executeMeuComando } from "./commands/meu-comando.js";
// No switch de comandos:
case "meucomando":
    await executeMeuComando(message, args);
    break;
```

3. Adiciona o Slash Command no `registerSlashCommands()`.

### Adicionar um endpoint REST

1. Adiciona a lógica em `src/services/` (reutilizável).
2. Regista a rota em `src/api/integrated-server.ts`.
3. Adiciona a chamada no dashboard em `src/api/public/app.js`.

### Adicionar uma tabela à base de dados

1. Adiciona o `CREATE TABLE` em `src/database/connection.ts`.
2. Cria a interface em `src/types/index.ts`.
3. Cria o service em `src/services/`.

## 📋 Convenções de Código

- **Linguagem**: TypeScript (strict mode)
- **Módulos**: ESM (`"type": "module"`)
- **Nomes**: camelCase para variáveis/funções, PascalCase para tipos
- **Commits**: em português ou inglês, descritivos
- **Comandos**: prefixo `!` (legado) + Slash Commands (novo)

## 🧪 Testes

```bash
# Correr testes (a implementar)
npm test
```

## 📝 Notas

- O bot usa **Discord.js v14** com Slash Commands nativos
- A IA usa **Groq SDK** com modelo `llama-3.3-70b-versatile`
- O mapa usa **Canvas** para gerar imagens táticas
- O dashboard é servido pelo mesmo processo do bot (Express)
- Puppeteer é dependência opcional (para captura de mapa)

## 🐛 Reportar Bugs

1. Verifica se o erro já foi reportado
2. Inclui steps para reproduzir
3. Inclui logs do terminal se possível

## 📄 Licença

ISC
