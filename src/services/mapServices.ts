import { createCanvas, loadImage } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import path from 'path';
import fs from 'fs';

const FULL_MAP_WIDTH = 4000;
const FULL_MAP_HEIGHT = 4000;
const DAYZ_MAP_SIZE = 15360; 

export async function gerarMapaComMarcacao(xCoord: number, yCoord: number, etiqueta: string, corRGB: string = '255,0,0') {
    const imagePath = path.join(process.cwd(), 'chernarus.png');
    
    if (!fs.existsSync(imagePath)) {
        throw new Error("O mapa 'chernarus.png' não foi encontrado na raiz do projeto.");
    }

    try {
        const background = await loadImage(imagePath);
        
        // Conversão de coordenadas
        const pixelX = (xCoord / DAYZ_MAP_SIZE) * FULL_MAP_WIDTH;
        const pixelY = FULL_MAP_HEIGHT - ((yCoord / DAYZ_MAP_SIZE) * FULL_MAP_HEIGHT);

        // Cria o canvas do tamanho exato do mapa completo
        const canvas = createCanvas(FULL_MAP_WIDTH, FULL_MAP_HEIGHT);
        const ctx = canvas.getContext('2d');

        // Desenha o mapa de 4000x4000
        ctx.drawImage(background, 0, 0, FULL_MAP_WIDTH, FULL_MAP_HEIGHT);

        // 🎯 1. Marcador Tático Gigante (Para ser visível de longe)
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, 40, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${corRGB}, 0.9)`;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8;
        ctx.stroke();

        // 📡 2. Zona de Radar (Anel translúcido para achar o ponto mais rápido)
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, 150, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 5;
        ctx.stroke();

        // 🏷️ 3. Texto Alinhado e Enorme
        ctx.font = 'bold 80px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 10;
        ctx.textAlign = 'center'; // Centraliza o texto sob o ponto para não cortar
        ctx.strokeText(etiqueta.toUpperCase(), pixelX, pixelY + 130);
        ctx.fillText(etiqueta.toUpperCase(), pixelX, pixelY + 130);

        // 🗜️ Compressão Tática em JPEG (Evita que o Discord aborte o upload)
        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.7 });
        return new AttachmentBuilder(buffer, { name: 'radar-frota-global.jpg' });

    } catch (error: any) {
        console.error("🚨 [ERRO NO CANVAS]:", error);
        throw new Error(`Falha técnica no satélite: ${error.message}`);
    }
}

