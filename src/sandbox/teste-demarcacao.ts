import puppeteer from 'puppeteer';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

// 1. A nossa fórmula calibrada com Projeção Web Mercator
function calcularCameraIzurvive(xMetros: number, yMetros: number, zoom: number = 7): string {
    const lng = ((xMetros / 15360) * 344) - 178;
    const yNorm = (yMetros / 15360);
    const radianos = (yNorm * 2 - 1) * Math.PI;
    const lat = Math.round((180 / Math.PI) * (2 * Math.atan(Math.exp(radianos)) - Math.PI / 2));
    const lngArredondado = Math.round(lng);

    return `https://www.izurvive.com/chernarusplussatmap/#c=${lat};${lngArredondado};${zoom}`;
}

async function executarTeste() {
    // 2. Definir as coordenadas do perímetro da base
    // Exemplo: 4 cantos de uma base
    const pontos = [
        { x: 5691.59, y: 15224.88 }, // Ponto 1 (Inferior Esquerdo)
        { x: 5706.41, y: 15162.42 }, // Ponto 2 (Superior Esquerdo)
        { x: 5740.92, y: 15168.26 }, // Ponto 3 (Superior Direito)
        { x: 5730.72, y: 15233.14 }  // Ponto 4 (Inferior Direito)
    ];

    // Calcula o Centro Exato da Base para apontar a câmara
    const centroX = pontos.reduce((acc, p) => acc + p.x, 0) / pontos.length;
    const centroY = pontos.reduce((acc, p) => acc + p.y, 0) / pontos.length;

    const urlAlvo = calcularCameraIzurvive(centroX, centroY, 7);
    const canvasWidth = 1000;
    const canvasHeight = 800;
    console.log(`url: ${urlAlvo}`)
    console.log(`\n🎯 Centro da Base Calculado: X: ${centroX} | Y: ${centroY}`);
    console.log("🚀 A iniciar satélite...");

    try {
        // --- ETAPA 1: CAPTURA DO FUNDO (PUPPETEER) ---
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: canvasWidth, height: canvasHeight });

        console.log("🗺️ A capturar terreno no iZurvive...");
        await page.goto(urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000)); // Aguarda texturas

        // Captura a imagem como Buffer em vez de salvar em arquivo
        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        // --- ETAPA 2: CAMADA TÁTICA (CANVAS) ---
        console.log("🎨 A injetar marcações táticas...");
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Carrega o print do Puppeteer como fundo
        const background = await loadImage(imageBuffer);
        ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

        // Configuração da Escala (Ajuste este valor se o desenho ficar maior/menor que a base real)
        const PIXELS_POR_METRO = 1.15; 
        const meioTelaX = canvasWidth / 2;
        const meioTelaY = canvasHeight / 2;

        // Desenhar a Área (Polígono Vermelho)
        ctx.strokeStyle = "rgba(255, 0, 0, 0.8)"; // Borda Vermelha
        ctx.lineWidth = 4;
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";   // Fundo Vermelho Transparente
        ctx.beginPath();

        pontos.forEach((ponto, index) => {
            // Calcula a distância do ponto até ao centro em metros, depois converte para pixels
            const diffX = (ponto.x - centroX) * PIXELS_POR_METRO;
            // O Eixo Y no Canvas é invertido (0 é em cima), por isso subtraímos
            const diffY = (ponto.y - centroY) * PIXELS_POR_METRO; 

            const pixelX = meioTelaX + diffX;
            const pixelY = meioTelaY - diffY; 

            if (index === 0) ctx.moveTo(pixelX, pixelY);
            else ctx.lineTo(pixelX, pixelY);
        });

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Desenhar um marcador (Alvo) no centro da base
        ctx.beginPath();
        ctx.arc(meioTelaX, meioTelaY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffcc00"; // Amarelo
        ctx.fill();
        ctx.stroke();

        // --- ETAPA 3: EXPORTAÇÃO ---
        const finalBuffer = canvas.toBuffer("image/png");
        fs.writeFileSync("planta-marcada.png", finalBuffer);

        console.log("✅ Imagem final processada e salva como 'planta-marcada.png'!");

    } catch (erro) {
        console.error("🚨 Falha crítica no sistema:", erro);
    }
}

executarTeste();