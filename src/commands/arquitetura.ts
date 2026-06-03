// @ts-nocheck — puppeteer not installed (optional dependency)
import { Message, AttachmentBuilder } from "discord.js";
import { createCanvas, loadImage } from "canvas";
import puppeteer from "puppeteer";

/*
export async function calcularCameraIzurvive(xMetros: number, yMetros: number, zoom: number = 7) {
    const lng = Math.round(((xMetros / 15360) * 344) - 178);
    const yNorm = (yMetros / 15360);
    const radianos = (yNorm * 2 - 1) * Math.PI;
    const lat = Math.round((180 / Math.PI) * (2 * Math.atan(Math.exp(radianos)) - Math.PI / 2));
    return `https://www.izurvive.com/chernarusplussatmap/#c=${lat};${lng};${zoom}`;
}
*/
export async function executeArquitetura(message: Message, args: string[]){
    if(args.length < 3) {
        return message.reply("🚨 Erro: Faltam coordenadas.");        
    }

    const pontos = [];
    for(let i = 0; i < args.length; i+=2) {
        const x = parseFloat(args[i] || "");
        const y = parseFloat(args[i+1] || "");
        if(isNaN(x) || isNaN(y)) {
            return message.reply("🚨 Erro de Sintaxe: As coordenadas devem ser números.");
        }
        else {
            pontos.push({ x,y });
        }
    }

    const centroX = pontos.reduce((acc, p) => acc + p.x, 0) / pontos.length;
    const centroY = pontos.reduce((acc, p) => acc + p.y, 0) / pontos.length;

    const aviso = await message.reply("🛰️ Satélite em órbita. A capturar terreno e injetar plantas táticas. Aguarde...");

    try {
        const urlAlvo = `https://www.izurvive.com/chernarusplussatmap/#loc=${centroX.toFixed(2)};${centroY.toFixed(2)}`;
        const canvasWidth = 1000;
        const canvasHeight = 800;

        // captura do terreno
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: canvasWidth, height: canvasHeight });

        await page.goto(await urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));

        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        // injecao da planta (canvas)
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        const background = await loadImage(Buffer.from(imageBuffer));
        ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

        const PIXELS_POR_METRO = 1.15; // Cakibragem de escala para o nivel de zoom 7.
        const meioTelaX = canvasWidth / 2;
        const meioTelaY = canvasHeight / 2;

        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
        ctx.lineWidth = 4;
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.beginPath();

        pontos.forEach((ponto, index) => {
            const diffX = (ponto.x - centroX) * PIXELS_POR_METRO;
            const diffY = (ponto.y - centroY) * PIXELS_POR_METRO;
            const pixelX = meioTelaX + diffX;
            const pixelY = meioTelaY - diffY;
            
            if (index === 0) ctx.moveTo(pixelX, pixelY);
            else ctx.lineTo(pixelX, pixelY);
            
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Marcador centrla (alvo amarelo)
        ctx.beginPath();
        ctx.arc(meioTelaX, meioTelaY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffcc00";
        ctx.fill();
        ctx.stroke();

        // retorno para o discord
        const finalBuffer = canvas.toBuffer("image/png");
        const attachment = new AttachmentBuilder(finalBuffer, { name: 'recon-base.png' });
        
        await aviso.edit({ 
            content: `🎯 **Captura Tática Concluída!**\n🗺️ Área monitorizada com centro em \`X: ${centroX.toFixed(1)} / Y: ${centroY.toFixed(1)}\``,
            files: [attachment] 
        });
    
    } catch (error) {
        console.error("Erro no módulo de arquitetura:", error);
        await aviso.edit("🚨 O satélite sofreu interferência atmosférica ou o tempo de resposta esgotou.");
    }
}
