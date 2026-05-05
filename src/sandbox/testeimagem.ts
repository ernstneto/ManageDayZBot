import { Message, AttachmentBuilder } from "discord.js";
import { createCanvas } from "canvas";

export async function executeTesteImagem(message: Message) {
    try {
        const msgProcessando = await message.reply("⏳ A testar permissões de upload no Discord...");

        // Cria um quadrado verde básico
        const canvas = createCanvas(200, 200);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#22c55e'; // Verde
        ctx.fillRect(0, 0, 200, 200);
        
        ctx.fillStyle = '#ffffff'; // Branco
        ctx.font = '24px Arial';
        ctx.fillText("API OK!", 50, 110);

        // Transforma o quadrado num anexo PNG
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'teste-api.png' });

        // Tenta editar a mensagem enviando o ficheiro
        await msgProcessando.edit({ content: "✅ O Discord aceitou a imagem!", files: [attachment] });
        
        console.log("🟢 [SUCESSO] Imagem enviada para o Discord!");

    } catch (error) {
        console.error("🔴 [ERRO DISCORD API]:", error);
        message.reply("🛑 Falha ao enviar o anexo. Verifique o terminal para ler o erro exato.");
    }
}