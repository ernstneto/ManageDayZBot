// @ts-nocheck — puppeteer not installed (optional dependency)
import puppeteer from 'puppeteer';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

// 1. A Nova Matriz de Interpolação Tática
function calcularCameraIzurvive(xMetros: number, yMetros: number, zoom: number = 8): string {
    // Eixo X (Linear)
    const lng = Math.round(((xMetros / 15360) * 344) - 178);

    // Eixo Y (Matriz baseada em telemetria real)
    const pontosCalibracao = [
        { y: 0, lat: -85 },
        { y: 2690, lat: -76 },
        { y: 7680, lat: 0 },
        { y: 14230, lat: 80 },
        { y: 15197, lat: 83 }, // O seu ponto crítico
        { y: 15360, lat: 85 }
    ];

    let lat = 0;
    for (let i = 0; i < pontosCalibracao.length - 1; i++) {
        const p1 = pontosCalibracao[i];
        const p2 = pontosCalibracao[i + 1];

        if (yMetros >= p1.y && yMetros <= p2.y) {
            const percentual = (yMetros - p1.y) / (p2.y - p1.y);
            lat = p1.lat + (percentual * (p2.lat - p1.lat));
            break;
        }
    }
    
    // Travas de segurança
    if (yMetros < 0) lat = -85;
    if (yMetros > 15360) lat = 85;

    return `https://www.izurvive.com/chernarusplussatmap/#c=${Math.round(lat)};${lng};${zoom}`;
}

// 2. O Motor de Teste
async function executarTeste() {
    // Captura coordenadas do terminal
    const args = process.argv.slice(2);
    let coordArgs = args;

    // Se não informar argumentos no terminal, usa as coordenadas da sua floresta
    if (args.length < 6) {
        console.log("⚠️ Argumentos insuficientes no terminal. A assumir coordenadas padrão da Base Norte...\n");
        coordArgs = [
            "5691.59", "15224.88", 
            "5706.41", "15162.42", 
            "5740.92", "15168.26", 
            "5730.72", "15233.14"
        ];
    }

    const pontos = [];
    for (let i = 0; i < coordArgs.length; i += 2) {
        const x = parseFloat(coordArgs[i] || "");
        const y = parseFloat(coordArgs[i+1] || "");
        if (!isNaN(x) && !isNaN(y)) pontos.push({ x, y });
    }

    const centroX = pontos.reduce((acc, p) => acc + p.x, 0) / pontos.length;
    const centroY = pontos.reduce((acc, p) => acc + p.y, 0) / pontos.length;

    // Usando zoom 8 para bater exatamente com o seu resultado esperado (#c=83;-50;8)
    const urlAlvo = calcularCameraIzurvive(centroX, centroY, 8);
    const canvasWidth = 1000;
    const canvasHeight = 800;

    console.log(`🎯 Centro da Base: X: ${centroX.toFixed(2)} | Y: ${centroY.toFixed(2)}`);
    console.log(`📡 URL Gerada pela Matriz: ${urlAlvo}`);
    console.log("🚀 A iniciar captura de satélite...");

    try {
        // --- ETAPA 1: CAPTURA DO FUNDO (PUPPETEER) ---
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: canvasWidth, height: canvasHeight });

        console.log("🗺️ A carregar mapa do iZurvive e a aguardar texturas (5 segundos)...");
        await page.goto(urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Tempo crucial para carregar os azulejos
        await new Promise(r => setTimeout(r, 60000));

        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        // --- ETAPA 2: CAMADA TÁTICA (CANVAS) ---
        console.log("🎨 A injetar marcações da planta...");
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        const background = await loadImage(imageBuffer);
        ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

        // Ajuste de escala. Como subimos para Zoom 8, a proporção de Pixels/Metro duplica.
        // Se a caixa vermelha ficar muito grande/pequena, altere este valor.
        const PIXELS_POR_METRO = 2.3; 
        
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

        ctx.beginPath();
        ctx.arc(meioTelaX, meioTelaY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#ffcc00";
        ctx.fill();
        ctx.stroke();

        // --- ETAPA 3: EXPORTAÇÃO ---
        const finalBuffer = canvas.toBuffer("image/png");
        fs.writeFileSync("planta-teste-interpolacao.png", finalBuffer);

        console.log("✅ Imagem final salva como 'planta-teste-interpolacao.png'!");

    } catch (erro) {
        console.error("🚨 Falha crítica no sistema:", erro);
    }
}

executarTeste();