import { Message, EmbedBuilder } from "discord.js";
import { gerarRespostaAI } from "../services/groqService.js";

export async function executeBase(message: Message, args: string[]) {
    // O utilizador digita algo como: !construcao 10 (onde 10 é o numero de paredes)
}