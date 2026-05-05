export const QUALIDADES_PERMITIDAS = [
    "Excelente",
    "Gasto",
    "Danificado",
    "Muito Danificado",
    "Destruído"
];

export const DIRETORIO_ITENS: Record<string, string[]> = {
    arsenal: [
       // Fuzis e Rifles
        "M4A1", "KAM", "KA-74", "KA-101", "VSD", "Mosin 91/30", "Blaze", "Tundra", 
        "LAR", "M16A2", "AUR AX", "AUR AUG", "SKS", "CR-527", "Pioneer", "FAL",
        // Submetralhadoras e Caçadeiras
        "SG5-K", "USG-45", "Vaigra", "BK-133", "BK-43", "BK-18", "Bizon",
        // Pistolas
        "IJ-70", "Mlock-91", "FX-45", "Deagle", "Revolver", "Kolt 1911", "MK II",
        // Munições e Explosivos
        "Munição 5.56x45mm", "Munição 7.62x39mm", "Munição .308 WIN", "Munição 7.62x54mmR", 
        "Munição .45 ACP", "Munição 9x19mm", "Munição 12 Gauge", "Munição .380 ACP",
        "Granada de Fragmentação", "Mina Terrestre", "Claymore", "Granada de Fumo",
        "C4", "Detonador Remoto",
        //Granadas
        "Granada de Fragmentação", "Mina Terrestre", "Claymore", "Granada de Fumo", "C4"
    ],

    construcao: [
        // Materiais Base
        "Pregos", "Chapa de Metal", "Tábua", "Tronco de Madeira", "Pedra",
        // Defesa
        "Arame Farpado", "Arame Liso", "Cadeado (3 Dígitos)", "Cadeado (4 Dígitos)", "Rede de Camuflagem",
        // Ferramentas de Engenharia
        "Alicate", "Martelo", "Machadinha", "Machado de Bombeiro", "Pá", "Picareta", 
        "Serra", "Corda", "Pé de Cabra", "Marreta",
        // Armazenamento
        "Tenda Militar", "Tenda Média", "Tenda de Carro", "Barril", "Caixa de Madeira", "Baú Marítimo"
    ],

    medicamento: [
        "Tetraciclina", "Comprimidos de Carvão", "Multivitamínico", "Comprimidos de Cloro", 
        "Kit de Sangue", "Bolsa de Soro IV", "Kit de Teste Sanguíneo", "Bandagem", 
        "Trapo", "Epinefrina", "Morfina", "Tala", "Iodo", "Termómetro"
    ],

    alimentos: [
        // Enlatados
        "Lata de Feijão", "Lata de Bacon", "Lata de Pêssego", "Lata de Sardinha", "Patê", "Esparguete Enlatado",
        // Carnes e Culinária
        "Bife de Vaca", "Bife de Porco", "Carne de Lobo", "Carne de Urso", "Gordura Animal",
        // Utensílios e Água
        "Água Engarrafada", "Cantil", "Panela", "Frigideira", "Botija de Gás", "Fogão Portátil"
    ],

    roupas: [
        // Trajes de Combate
        "Casaco de Caçador", "Calças de Caçador", "Farda Militar (CUU)", "Farda Patrol", "Ghillie Suit",
        // Proteção
        "Colete Balístico", "Colete de Placas", "Capacete Tático", "Capacete de Assalto", "Máscara de Gás", 
        // Acessórios
        "Botas de Combate", "Mochila de Montanha", "Mochila Militar", "Mochila de Caça", "Luvas Táticas", "Cinto Tático"
    ],
    
    veiculos: [
        // Peças de Motor Genéricas (Servem em quase todos)
        "Bateria de Carro", "Bateria de Camião", "Vela de Ignição", "Radiador", "Galão de Gasolina", "Lâmpada de Farol",
        
        // Lada Niva (Ada 4x4)
        "Roda de Ada", "Pneu de Ada", "Porta de Ada", "Capô de Ada", "Porta-malas de Ada",
        
        // VW Golf (Gunter 2)
        "Roda de Gunter", "Pneu de Gunter", "Porta de Gunter", "Capô de Gunter", "Porta-malas de Gunter",
        
        // GAZ Volga (Olga 24)
        "Roda de Olga", "Pneu de Olga", "Porta de Olga", "Capô de Olga", "Porta-malas de Olga",
        
        // Skoda 120 (Sarka 120)
        "Roda de Sarka", "Pneu de Sarka", "Porta de Sarka", "Capô de Sarka", "Porta-malas de Sarka",
        
        // V3S Truck (M3S Commander)
        "Roda de Camião", "Roda Dupla de Camião", "Porta de Camião", "Capô de Camião", "Pneu de Camião",
        
        // Humvee (M1025)
        "Roda de Humvee", "Pneu de Humvee", "Porta de Humvee", "Porta-malas de Humvee"
    ],

    manutencao: [
        "Fita Adesiva", "Kit de Limpeza de Armas", "Kit de Costura", "Kit de Costura de Couro", "Epóxi", 
        "Pedra de Amolar", "Massa Consistente", "Pé de Cabra"
    ],

    sobrevivencia: [
        "Faca de Caça", "Faca de Combate", "Isqueiro", "Fósforos", "Lanterna", "Pilha 9V", 
        "Visão Noturna (NVG)", "Rádio Transmissor", "GPS", "Bússola", "Binóculos", "Telêmetro"
    ]
};

export function buscarInfoItem(input: string): {nomeOficial: string, categoria: string} | null {
    const inputLimpo = input.trim().toLowerCase();
    for (const [categoria, itens] of Object.entries(DIRETORIO_ITENS)) {
        const matchExato = itens.find(item => item.toLowerCase() === inputLimpo);
        if (matchExato) return { nomeOficial: matchExato, categoria };

        const matchParcial = itens.find(item => item.toLowerCase().includes(inputLimpo));
        if (matchParcial) return { nomeOficial: matchParcial, categoria };
    }
    return null;
}

export function validarQualidade(input: string): string {
    const inputLimpo = input.trim().toLowerCase();
    const match = QUALIDADES_PERMITIDAS.find(qualidade => qualidade.toLowerCase() === inputLimpo);
    return match || "Excelente";
}

// ============================================================================
// SISTEMA DE LOADOUTS (KITS RÁPIDOS)
// ============================================================================
export const KITS_TATICOS: Record<string, {item: string, quantidade: number}[]> = {
    "assalto": [
        { item: "M4A1", quantidade: 1 },
        { item: "Munição 5.56x45mm", quantidade: 3 },
        { item: "bandagem", quantidade: 2 },
        { item: "Cantil", quantidade: 1 },
        { item: "Lata de Feijão", quantidade: 2 }
    ],
    "sniper": [
        { item: "VSD", quantidade: 1 },
        { item: "Munição 7.62x54mmR", quantidade: 3 },
        { item: "bandagem", quantidade: 2 },
        { item: "Cantil", quantidade: 1 },
        { item: "Lata de Feijão", quantidade: 2 }
    ],
    "medico": [
        { item: "bolsa de Soro IV", quantidade: 4 },
        { item: "Lata de Feijão", quantidade: 2 },
        { item: "Cantil", quantidade: 1 },
        { item: "Multivitamínico", quantidade: 2 },
        { item: "Comprimidos de Carvão", quantidade: 2 },
        { item: "Comprimidos de Cloro", quantidade: 2 },
        { item: "Tetraciclina", quantidade: 3 },
        { item: "Bandagem", quantidade: 5 },
        { item: "Trapo", quantidade: 5 },
        { item: "Epinefrina", quantidade: 2 },
        { item: "Morfina", quantidade: 2 },
        { item: "Tala", quantidade: 2 },
        { item: "Iodo", quantidade: 2 }
    ]
};