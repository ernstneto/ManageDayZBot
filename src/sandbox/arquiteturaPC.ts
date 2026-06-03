// @ts-nocheck — puppeteer not installed (optional dependency)
import puppeteer from 'puppeteer';

// 1. A nossa fórmula calibrada com Projeção Web Mercator
function calcularCameraIzurvive(xMetros: number, yMetros: number, zoom: number = 6): string {
    const lngRaw = ((xMetros / 15360) * 344) - 178;
    const lng = Math.round(lngRaw);
    console.log(`lat: ${lngRaw} | lng: ${lng}`);

    const yNorm = (yMetros / 15360);
    const escalaMercator = yNorm * 2 - 1;
    const radianos = escalaMercator * Math.PI;
    
    let latRaw = (180 / Math.PI) * (2 * Math.atan(Math.exp(radianos)) - Math.PI / 2);
    console.log(`latRaw: ${latRaw}`);
    const lat = Math.round(latRaw); // Ajuste de achatamento específico do iZurvive
    

    return `https://www.izurvive.com/chernarusplussatmap/#c=${lat.toFixed(0)};${lng.toFixed(0)};${zoom}`;
}

// 2. Execução Dinâmica via Terminal
async function executarTeste() {
    // Captura os argumentos digitados no terminal (ignora os 2 primeiros que são o node e o script)
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error("🚨 Erro de Sintaxe: Faltam coordenadas.");
        console.error("Uso correto: npx tsx teste-satelite.ts <X> <Y> [Zoom]");
        console.error("Exemplo 1 (Com Zoom): npx tsx teste-satelite.ts 13522 14230 8");
        console.error("Exemplo 2 (Sem Zoom): npx tsx teste-satelite.ts 13522 14230");
        return;
    }

    const eixoX = parseFloat(args[0]);
    const eixoY = parseFloat(args[1]);

    // Se o terceiro argumento existir, usa-o. Se não, adota o padrão 7.
    const zoomParam = args[2] ? parseInt(args[2], 10) : 7;

    if (isNaN(eixoX) || isNaN(eixoY) || isNaN(zoomParam)) {
        console.error("🚨 Erro: As coordenadas e o zoom devem ser números válidos.");
        return;
    }

    const urlAlvo = calcularCameraIzurvive(eixoX, eixoY, zoomParam);

    console.log(`\n🎯 Alvo Confirmado: X: ${eixoX} | Y: ${eixoY}`);
    console.log(`🔎 Nível de Zoom: ${zoomParam}`);
    console.log(`📡 URL Calculada: ${urlAlvo}`);
    console.log("🚀 A iniciar motor Puppeteer...");

    try {
        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox'] 
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1000, height: 800 });

        console.log("🗺️ A carregar mapa e a aplicar distorção Mercator...");
        await page.goto(urlAlvo, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log("⏳ A aguardar estabilização dos azulejos...");
        await new Promise(r => setTimeout(r, 3000));

        console.log("📸 A capturar imagem térmica...");
        const nomeFicheiro = `captura-X${eixoX}-Y${eixoY}-Z${zoomParam}.png`;
        await page.screenshot({ path: nomeFicheiro, type: 'png' });

        await browser.close();
        console.log(`✅ Missão Cumprida! Imagem guardada como '${nomeFicheiro}'\n`);

    } catch (erro) {
        console.error("🚨 Falha crítica no satélite:", erro);
    }
}
