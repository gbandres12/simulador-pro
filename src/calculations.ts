/**
 * MÓDULO DE CÁLCULOS ESTRUTURAIS
 * Interpolação técnica baseada em tabelas de galpões metálicos
 */

interface ProjectData {
    vao: number
    comprimento: number
    altura: number
    inclinacao: number
    tipologia: 'portico' | 'trelicado' | ''
    sobrecarga: number
    fechamento: 'completo' | 'parcial' | 'aberto' | ''
    regiao: number
    empresa: string
    cliente: string
    custoAco: number
    margem: number
}

interface CalculationResults {
    pesoTotal: number
    pesoM2: number
    area: number
    volume: number
    custoMaterial: number
    custoMontagem: number
    valorMargem: number
    valorTotal: number
}

/**
 * Tabelas de referência para cálculo de peso estrutural
 * Baseadas em dados técnicos de galpões industriais
 */
const TABELA_PESO_BASE = {
    portico: {
        // Peso base (kg/m²) para pórtico alma cheia
        50: { min: 18, max: 25 },   // sobrecarga 50 kg/m²
        75: { min: 22, max: 28 },   // sobrecarga 75 kg/m²
        100: { min: 25, max: 32 }   // sobrecarga 100 kg/m²
    },
    trelicado: {
        // Peso base (kg/m²) para treliçado (mais leve)
        50: { min: 14, max: 20 },
        75: { min: 17, max: 24 },
        100: { min: 20, max: 28 }
    }
}

/**
 * Fatores de ajuste baseados em parâmetros do projeto
 */
const FATORES = {
    vao: {
        pequeno: 0.90,  // vão < 15m
        medio: 1.00,    // vão 15-25m
        grande: 1.15    // vão > 25m
    },
    altura: {
        baixa: 0.95,    // altura < 5m
        media: 1.00,    // altura 5-8m
        alta: 1.10      // altura > 8m
    },
    fechamento: {
        aberto: 0.85,
        parcial: 0.95,
        completo: 1.00
    },
    regiao: {
        1: 1.00,  // vento 30 m/s
        2: 1.05,  // vento 35 m/s
        3: 1.10,  // vento 40 m/s
        4: 1.15   // vento 45 m/s
    },
    inclinacao: {
        baixa: 0.98,   // < 8%
        media: 1.00,   // 8-15%
        alta: 1.05     // > 15%
    }
}

/**
 * Calcula o fator de ajuste baseado no vão
 */
function getFatorVao(vao: number): number {
    if (vao < 15) return FATORES.vao.pequeno
    if (vao <= 25) return FATORES.vao.medio
    return FATORES.vao.grande
}

/**
 * Calcula o fator de ajuste baseado na altura
 */
function getFatorAltura(altura: number): number {
    if (altura < 5) return FATORES.altura.baixa
    if (altura <= 8) return FATORES.altura.media
    return FATORES.altura.alta
}

/**
 * Calcula o fator de ajuste baseado na inclinação
 */
function getFatorInclinacao(inclinacao: number): number {
    if (inclinacao < 8) return FATORES.inclinacao.baixa
    if (inclinacao <= 15) return FATORES.inclinacao.media
    return FATORES.inclinacao.alta
}

/**
 * Calcula o peso por m² baseado em interpolação
 */
function calcularPesoM2(data: ProjectData): number {
    const tabela = TABELA_PESO_BASE[data.tipologia as 'portico' | 'trelicado']
    const faixa = tabela[data.sobrecarga as 50 | 75 | 100]

    // Peso base (interpolação entre min e max baseada no vão)
    const progressao = Math.min((data.vao - 10) / 40, 1) // normaliza vão entre 10-50m
    const pesoBase = faixa.min + (faixa.max - faixa.min) * progressao

    // Aplicar fatores de ajuste
    const fatorVao = getFatorVao(data.vao)
    const fatorAltura = getFatorAltura(data.altura)
    const fatorFechamento = FATORES.fechamento[data.fechamento as 'completo' | 'parcial' | 'aberto']
    const fatorRegiao = FATORES.regiao[data.regiao as 1 | 2 | 3 | 4]
    const fatorInclinacao = getFatorInclinacao(data.inclinacao)

    const pesoM2 = pesoBase * fatorVao * fatorAltura * fatorFechamento * fatorRegiao * fatorInclinacao

    return pesoM2
}

/**
 * Calcula o custo de montagem (40% do custo de material)
 */
function calcularCustoMontagem(custoMaterial: number): number {
    return custoMaterial * 0.40
}

/**
 * Função principal de cálculo
 */
export function calculateStructure(data: ProjectData): CalculationResults {
    // Cálculos geométricos
    const area = data.vao * data.comprimento
    const alturaTotal = data.altura + (data.vao * data.inclinacao / 200) // altura no oitão
    const volume = area * alturaTotal

    // Cálculos estruturais
    const pesoM2 = calcularPesoM2(data)
    const pesoTotal = area * pesoM2

    // Cálculos financeiros
    const custoMaterial = pesoTotal * data.custoAco
    const custoMontagem = calcularCustoMontagem(custoMaterial)
    const subtotal = custoMaterial + custoMontagem
    const valorMargem = subtotal * (data.margem / 100)
    const valorTotal = subtotal + valorMargem

    return {
        pesoTotal,
        pesoM2,
        area,
        volume,
        custoMaterial,
        custoMontagem,
        valorMargem,
        valorTotal
    }
}

/**
 * Gera lista de itens inclusos baseado na tipologia
 */
export function getItensInclusos(tipologia: string): string[] {
    const itensComuns = [
        'Estrutura metálica completa',
        'Placas de base e chumbadores',
        'Terças metálicas',
        'Contraventamento de cobertura',
        'Pintura de proteção anticorrosiva',
        'Projeto estrutural e memorial de cálculo'
    ]

    if (tipologia === 'portico') {
        return [
            ...itensComuns,
            'Pórticos de alma cheia',
            'Vigas de rolamento (se aplicável)'
        ]
    } else {
        return [
            ...itensComuns,
            'Treliças metálicas',
            'Tesouras de cobertura',
            'Banzos superiores e inferiores'
        ]
    }
}

/**
 * Gera lista de itens não inclusos
 */
export function getItensNaoInclusos(): string[] {
    return [
        'Fundações em concreto',
        'Fechamento lateral e telhas',
        'Paredes de alvenaria',
        'Instalações elétricas e hidráulicas',
        'Escadas e guarda-corpos',
        'Ponte rolante e talhas',
        'Transporte e logística',
        'Licenciamento e aprovações'
    ]
}
