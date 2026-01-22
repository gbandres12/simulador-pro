import './style.css'
import { initViewer3D, updateStructure3D } from './viewer3d'
import { calculateStructure } from './calculations'

// ===================================
// STATE MANAGEMENT
// ===================================

interface ProjectData {
  // Step 1: Dimensões
  vao: number
  comprimento: number
  altura: number
  inclinacao: number

  // Step 2: Tipologia
  tipologia: 'portico' | 'trelicado' | ''
  sobrecarga: number
  fechamento: 'completo' | 'parcial' | 'aberto' | ''
  regiao: number

  // Step 3: Detalhes
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

let currentStep = 1
const projectData: ProjectData = {
  vao: 0,
  comprimento: 0,
  altura: 0,
  inclinacao: 10,
  tipologia: '',
  sobrecarga: 0,
  fechamento: '',
  regiao: 0,
  empresa: 'Almeida Engenharia',
  cliente: '',
  custoAco: 12.5,
  margem: 30
}

let calculationResults: CalculationResults | null = null

// ===================================
// WIZARD NAVIGATION
// ===================================

function updateWizardStep(step: number) {
  // Update step indicators
  const steps = document.querySelectorAll('.step')
  steps.forEach((stepEl, index) => {
    const stepNum = index + 1
    stepEl.classList.remove('active', 'completed')

    if (stepNum === step) {
      stepEl.classList.add('active')
    } else if (stepNum < step) {
      stepEl.classList.add('completed')
    }
  })

  // Update panels
  const panels = document.querySelectorAll('.wizard-panel')
  panels.forEach((panel, index) => {
    panel.classList.remove('active')
    if (index + 1 === step) {
      panel.classList.add('active')
    }
  })

  currentStep = step
}

function nextStep() {
  if (validateCurrentStep()) {
    updateWizardStep(currentStep + 1)
  }
}

function previousStep() {
  updateWizardStep(currentStep - 1)
}

// ===================================
// VALIDATION
// ===================================

function validateField(input: HTMLInputElement | HTMLSelectElement): boolean {
  const value = input.value.trim()

  if (!value) {
    input.classList.add('error')
    return false
  }

  if (input instanceof HTMLInputElement && input.type === 'number') {
    const num = parseFloat(value)
    const min = parseFloat(input.min)
    const max = parseFloat(input.max)

    if (isNaN(num) || (min && num < min) || (max && num > max)) {
      input.classList.add('error')
      return false
    }
  }

  input.classList.remove('error')
  return true
}

function validateCurrentStep(): boolean {
  const panel = document.querySelector(`#panel-${currentStep}`)
  if (!panel) return false

  const inputs = panel.querySelectorAll('input[required], select[required]')
  let isValid = true

  inputs.forEach((input) => {
    if (!validateField(input as HTMLInputElement | HTMLSelectElement)) {
      isValid = false
    }
  })

  return isValid
}

// ===================================
// DATA COLLECTION
// ===================================

function collectFormData() {
  // Step 1
  projectData.vao = parseFloat((document.getElementById('vao') as HTMLInputElement).value)
  projectData.comprimento = parseFloat((document.getElementById('comprimento') as HTMLInputElement).value)
  projectData.altura = parseFloat((document.getElementById('altura') as HTMLInputElement).value)
  projectData.inclinacao = parseFloat((document.getElementById('inclinacao') as HTMLInputElement).value)

  // Step 2
  projectData.tipologia = (document.getElementById('tipologia') as HTMLSelectElement).value as 'portico' | 'trelicado'
  projectData.sobrecarga = parseFloat((document.getElementById('sobrecarga') as HTMLSelectElement).value)
  projectData.fechamento = (document.getElementById('fechamento') as HTMLSelectElement).value as 'completo' | 'parcial' | 'aberto'
  projectData.regiao = parseFloat((document.getElementById('regiao') as HTMLSelectElement).value)

  // Step 3
  projectData.empresa = (document.getElementById('empresa') as HTMLInputElement).value
  projectData.cliente = (document.getElementById('cliente') as HTMLInputElement).value
  projectData.custoAco = parseFloat((document.getElementById('custo-aco') as HTMLInputElement).value)
  projectData.margem = parseFloat((document.getElementById('margem') as HTMLInputElement).value)
}

// ===================================
// CALCULATIONS & RESULTS
// ===================================

function performCalculations() {
  if (!validateCurrentStep()) {
    return
  }

  collectFormData()

  // Perform calculations
  calculationResults = calculateStructure(projectData)

  // Display results
  displayResults()

  // Update 3D view
  updateStructure3D(projectData)

  // Show results section
  document.getElementById('results-section')?.classList.add('active')

  // Scroll to results
  document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' })
}

function displayResults() {
  if (!calculationResults) return

  // Technical data
  document.getElementById('result-peso-total')!.textContent =
    `${calculationResults.pesoTotal.toFixed(2)} kg`
  document.getElementById('result-peso-m2')!.textContent =
    `${calculationResults.pesoM2.toFixed(2)} kg/m²`
  document.getElementById('result-area')!.textContent =
    `${calculationResults.area.toFixed(2)} m²`
  document.getElementById('result-volume')!.textContent =
    `${calculationResults.volume.toFixed(2)} m³`

  // Financial data
  document.getElementById('result-custo-material')!.textContent =
    `R$ ${calculationResults.custoMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  document.getElementById('result-custo-montagem')!.textContent =
    `R$ ${calculationResults.custoMontagem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  document.getElementById('result-margem')!.textContent =
    `R$ ${calculationResults.valorMargem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  document.getElementById('result-valor-total')!.textContent =
    `R$ ${calculationResults.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

// ===================================
// PDF GENERATION
// ===================================

async function generatePDF() {
  if (!calculationResults) {
    alert('Por favor, calcule o projeto primeiro!')
    return
  }

  try {
    const response = await fetch('http://localhost:5000/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectData,
        results: calculationResults
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao gerar PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Proposta_${projectData.cliente.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    alert('Erro ao gerar PDF. Verifique se o backend está rodando.')
  }
}

// ===================================
// EVENT LISTENERS
// ===================================

function initEventListeners() {
  // Step navigation buttons
  document.getElementById('btn-step1-next')?.addEventListener('click', nextStep)

  document.getElementById('btn-step2-prev')?.addEventListener('click', previousStep)
  document.getElementById('btn-step2-next')?.addEventListener('click', nextStep)

  document.getElementById('btn-step3-prev')?.addEventListener('click', previousStep)
  document.getElementById('btn-calcular')?.addEventListener('click', performCalculations)

  // Results actions
  document.getElementById('btn-download-pdf')?.addEventListener('click', generatePDF)
  document.getElementById('btn-new-project')?.addEventListener('click', () => {
    location.reload()
  })

  // Real-time validation
  const allInputs = document.querySelectorAll('input, select')
  allInputs.forEach((input) => {
    input.addEventListener('blur', () => {
      validateField(input as HTMLInputElement | HTMLSelectElement)
    })

    input.addEventListener('input', () => {
      (input as HTMLElement).classList.remove('error')
    })
  })

  // Step indicators click navigation
  document.querySelectorAll('.step').forEach((step, index) => {
    step.addEventListener('click', () => {
      const targetStep = index + 1
      if (targetStep < currentStep) {
        updateWizardStep(targetStep)
      }
    })
  })
}

// ===================================
// INITIALIZATION
// ===================================

function init() {
  console.log('🚀 Engenheiro de Bolso - Estruturas Metálicas Pro')
  console.log('Inicializando aplicação...')

  initEventListeners()
  initViewer3D()

  console.log('✅ Aplicação inicializada com sucesso!')
}

// Start application
init()
