import { Message, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { createCanvas } from "canvas";
import { gerarRespostaAI } from "../services/groqService.js";

export async function executeArquitetura(message: Message, args: string[]) {
    if (args.length < 3) {
        message.reply("⚠️ Precisa de pelo menos 3 coordenadas. Ex: `!arquitetura (300,300) [800,800] {1200,900}`");
        return;
    }

    const msgProcessando = await message.reply("⏳ A processar topografia, calcular materiais e a gerar planta visual...");

    let descontoCenarioTotal = 0;
    const pontosFormatados: string[] = [];

    // Remoção de ( ) [ ] { }
    const higienizar = (texto: string) => texto.replace(/[()[\]{}]/g, '');

    for (const arg of args) {
        if (arg.startsWith('--cenario=')) {
            const coordsCenario = higienizar(arg.split('=')[1] || '');
            const [pontoA, pontoB] = coordsCenario.split(':');
            
            if (pontoA && pontoB) {
                // BLINDAGEM TS: Avisar o TypeScript que teremos a certeza de que há 2 números
                const [xA, yA] = pontoA.split(',').map(parseFloat) as [number, number];
                const [xB, yB] = pontoB.split(',').map(parseFloat) as [number, number];
                
                if (!isNaN(xA) && !isNaN(yA) && !isNaN(xB) && !isNaN(yB)) {
                    descontoCenarioTotal += Math.sqrt(Math.pow(xB - xA, 2) + Math.pow(yB - yA, 2));
                }
            }
        } else {
            pontosFormatados.push(higienizar(arg));
        }
    }

    const pontos = pontosFormatados.map(arg => {
        const [x, y] = arg.split(',').map(parseFloat) as [number, number];
        return { x, y };
    });

    // BLINDAGEM TS: Garantir que não geramos o Canvas com pontos falhados
    if (pontos.length === 0 || pontos.some(p => isNaN(p.x) || isNaN(p.y))) {
        msgProcessando.edit("🛑 Erro tático: As coordenadas inseridas não são válidas.");
        return;
    }

    let perimetroTotal = 0;
    for (let i = 0; i < pontos.length; i++) {
        // BLINDAGEM TS: O operador '!' garante ao TS que o índice existe
        const pontoAtual = pontos[i]!;
        const proximoPonto = pontos[(i + 1) % pontos.length]!; 
        const distancia = Math.sqrt(Math.pow(proximoPonto.x - pontoAtual.x, 2) + Math.pow(proximoPonto.y - pontoAtual.y, 2));
        perimetroTotal += distancia;
    }

    const LARGURA_PAREDE = 3.8;
    const qtdTorres = pontos.length;
    const perimetroParaConstruir = Math.max(0, perimetroTotal - (qtdTorres * LARGURA_PAREDE) - descontoCenarioTotal);
    
    const qtdParedes = Math.ceil(perimetroParaConstruir / LARGURA_PAREDE);
    const qtdPortoes = 1;
    const paredesReais = Math.max(0, qtdParedes - qtdPortoes);

    const troncos = (paredesReais * 2) + (qtdPortoes * 2) + (qtdTorres * 4);
    const tabuas = (paredesReais * 18) + (qtdPortoes * 18) + (qtdTorres * 54); 
    const pregos = (paredesReais * 36) + (qtdPortoes * 36) + (qtdTorres * 108);

    const canvas = createCanvas(800, 800);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i <= 800; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 800); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
    }

    // BLINDAGEM TS: Declaração limpa dos min e max para o cálculo do zoom
    const xs = pontos.map(p => p.x);
    const ys = pontos.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const margem = 100;
    const divX = (maxX - minX === 0) ? 1 : (maxX - minX);
    const divY = (maxY - minY === 0) ? 1 : (maxY - minY);
    const escalaX = (canvas.width - margem * 2) / divX;
    const escalaY = (canvas.height - margem * 2) / divY;
    const escala = Math.min(escalaX, escalaY);

    const projetar = (ponto: {x: number, y: number}) => ({
        x: margem + (ponto.x - minX) * escala,
        y: margem + (ponto.y - minY) * escala
    });

    ctx.strokeStyle = '#fcd34d'; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    const p0 = projetar(pontos[0]!);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < pontos.length; i++) {
        const p = projetar(pontos[i]!);
        ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#ef4444'; 
    for (const ponto of pontos) {
        const p = projetar(ponto);
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20); 
    }

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'blueprint.png' });

    const promptIA = `O jogador projetou uma base com perímetro de ${perimetroTotal.toFixed(0)} metros usando ${pontos.length} vértices (quinas). 
    A base terá ${qtdTorres} Torres de Vigia, ${qtdPortoes} Portão e ${paredesReais} Paredes. 
    Aja como um Engenheiro Militar. Faça uma breve análise tática dessa geometria. 
    Responda em português, curto e direto ao ponto. (Máx 100 palavras).`;

    const memoriaTemporaria = [
        { role: "system", content: "Você é um arquiteto e estratega militar do jogo DayZ." },
        { role: "user", content: promptIA }
    ];

    try {
        const analiseIA = await gerarRespostaAI(memoriaTemporaria);

        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('🏗️ Projeto Arquitetónico e Logístico')
            .setDescription(`Topografia calculada a partir de ${pontos.length} coordenadas.`)
            .addFields(
                { name: '📏 Perímetro Total', value: `${perimetroTotal.toFixed(2)} metros`, inline: true },
                { name: '🧱 Estruturas', value: `${qtdTorres} Torres\n${paredesReais} Paredes\n${qtdPortoes} Portão`, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '🌲 Troncos', value: `${troncos}`, inline: true },
                { name: '🪵 Tábuas', value: `${tabuas}`, inline: true },
                { name: '🔨 Pregos', value: `${pregos}`, inline: true },
                { name: '🧠 Análise Tática (IA)', value: analiseIA, inline: false }
            )
            .setImage('attachment://blueprint.png') 
            .setFooter({ text: `Engenheiro Chefe: ${message.author.username}` });

        await msgProcessando.edit({ content: "✅ Renderização concluída.", embeds: [embed], files: [attachment] });

    } catch (error) {
        console.error(error);
        await msgProcessando.edit("🛑 Falha crítica no processamento da imagem ou IA.");
    }
}