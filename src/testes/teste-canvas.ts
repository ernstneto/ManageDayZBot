import {createCanvas } from "canvas";

try {
    console.log("🎨 A iniciar o motor de renderização Canvas...");
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log("🟢 CANVAS OPERACIONAL! A biblioteca gráfica está a funcionar.");
    
} catch (error) {
    console.error("🔴 ERRO NO CANVAS (O Motor falhou):", error);
}
