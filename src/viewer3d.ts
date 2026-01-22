/**
 * MÓDULO DE VISUALIZAÇÃO 3D
 * Renderização de estruturas metálicas com Three.js
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface ProjectData {
    vao: number
    comprimento: number
    altura: number
    inclinacao: number
    tipologia: 'portico' | 'trelicado' | ''
    fechamento: 'completo' | 'parcial' | 'aberto' | ''
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let structureGroup: THREE.Group
let autoRotate = false
let wireframeMode = false

const canvas = document.getElementById('canvas-3d') as HTMLCanvasElement

/**
 * Inicializa a cena 3D
 */
export function initViewer3D() {
    if (!canvas) {
        console.warn('Canvas 3D não encontrado')
        return
    }

    // Scene setup
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.Fog(0x1a1a2e, 50, 200)

    // Camera setup
    const aspect = canvas.clientWidth / canvas.clientHeight
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
    camera.position.set(40, 30, 40)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 20
    controls.maxDistance = 150
    controls.maxPolarAngle = Math.PI / 2 - 0.1

    // Lighting
    setupLighting()

    // Ground
    createGround()

    // Structure group
    structureGroup = new THREE.Group()
    scene.add(structureGroup)

    // Event listeners
    setupViewerControls()
    window.addEventListener('resize', onWindowResize)

    // Animation loop
    animate()

    console.log('✅ Visualizador 3D inicializado')
}

/**
 * Configuração de iluminação premium
 */
function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(30, 50, 30)
    mainLight.castShadow = true
    mainLight.shadow.camera.left = -50
    mainLight.shadow.camera.right = 50
    mainLight.shadow.camera.top = 50
    mainLight.shadow.camera.bottom = -50
    mainLight.shadow.camera.near = 0.1
    mainLight.shadow.camera.far = 200
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    scene.add(mainLight)

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x7b9cff, 0.3)
    fillLight.position.set(-20, 20, -20)
    scene.add(fillLight)

    // Hemisphere light for natural ambient
    const hemiLight = new THREE.HemisphereLight(0x7b9cff, 0x4a5568, 0.3)
    scene.add(hemiLight)
}

/**
 * Cria o plano de base (terreno)
 */
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.8,
        metalness: 0.2
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    scene.add(ground)

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x4a5568, 0x2d3748)
    gridHelper.position.y = 0
    scene.add(gridHelper)
}

/**
 * Atualiza a estrutura 3D baseada nos dados do projeto
 */
export function updateStructure3D(data: ProjectData) {
    // Limpa estrutura anterior
    structureGroup.clear()

    if (data.tipologia === 'portico') {
        createPorticoStructure(data)
    } else if (data.tipologia === 'trelicado') {
        createTrelicadoStructure(data)
    }

    // Adiciona fechamento se necessário
    if (data.fechamento !== 'aberto') {
        createFechamento(data)
    }

    // Centraliza câmera na estrutura
    centerCameraOnStructure(data)
}

/**
 * Cria estrutura de pórtico alma cheia
 */
function createPorticoStructure(data: ProjectData) {
    const { vao, comprimento, altura, inclinacao } = data

    const alturaOitao = altura + (vao * inclinacao / 200)
    const numPorticos = Math.floor(comprimento / 5) + 1 // pórtico a cada 5m

    // Material para colunas e vigas (Orange Theme)
    const steelMaterial = new THREE.MeshStandardMaterial({
        color: 0xf97316, // primary-500
        roughness: 0.3,
        metalness: 0.9,
        emissive: 0x7c2d12, // darker orange
        emissiveIntensity: 0.05
    })

    for (let i = 0; i < numPorticos; i++) {
        const zPos = (i * comprimento / (numPorticos - 1)) - comprimento / 2

        // Coluna esquerda
        const colunaEsq = createIBeam(0.4, altura, 0.3)
        colunaEsq.material = steelMaterial
        colunaEsq.position.set(-vao / 2, altura / 2, zPos)
        colunaEsq.castShadow = true
        structureGroup.add(colunaEsq)

        // Coluna direita
        const colunaDir = createIBeam(0.4, altura, 0.3)
        colunaDir.material = steelMaterial
        colunaDir.position.set(vao / 2, altura / 2, zPos)
        colunaDir.castShadow = true
        structureGroup.add(colunaDir)

        // Viga de cobertura (duas águas)
        const vigaEsq = createIBeam(0.5, vao / 2, 0.4)
        vigaEsq.material = steelMaterial
        vigaEsq.rotation.z = Math.atan(inclinacao / 100)
        vigaEsq.position.set(-vao / 4, altura + alturaOitao / 4, zPos)
        vigaEsq.castShadow = true
        structureGroup.add(vigaEsq)

        const vigaDir = createIBeam(0.5, vao / 2, 0.4)
        vigaDir.material = steelMaterial
        vigaDir.rotation.z = -Math.atan(inclinacao / 100)
        vigaDir.position.set(vao / 4, altura + alturaOitao / 4, zPos)
        vigaDir.castShadow = true
        structureGroup.add(vigaDir)
    }

    // Terças
    createTercas(data, steelMaterial)

    // Contraventamento
    createContraventamento(data)
}

/**
 * Cria estrutura treliçada
 */
function createTrelicadoStructure(data: ProjectData) {
    const { vao, comprimento, altura, inclinacao } = data

    const alturaOitao = altura + (vao * inclinacao / 200)
    const numTrelicas = Math.floor(comprimento / 6) + 1

    const steelMaterial = new THREE.MeshStandardMaterial({
        color: 0xfb923c, // primary-400
        roughness: 0.5,
        metalness: 0.7,
        emissive: 0x9a3412,
        emissiveIntensity: 0.05
    })

    for (let i = 0; i < numTrelicas; i++) {
        const zPos = (i * comprimento / (numTrelicas - 1)) - comprimento / 2

        // Colunas
        const colunaEsq = createTubeProfile(0.3, altura, 0.25)
        colunaEsq.material = steelMaterial
        colunaEsq.position.set(-vao / 2, altura / 2, zPos)
        colunaEsq.castShadow = true
        structureGroup.add(colunaEsq)

        const colunaDir = createTubeProfile(0.3, altura, 0.25)
        colunaDir.material = steelMaterial
        colunaDir.position.set(vao / 2, altura / 2, zPos)
        colunaDir.castShadow = true
        structureGroup.add(colunaDir)

        // Treliça
        createTrelica(vao, alturaOitao, zPos, steelMaterial)
    }

    // Terças
    createTercas(data, steelMaterial)
}

/**
 * Cria uma treliça completa
 */
function createTrelica(vao: number, altura: number, zPos: number, material: THREE.Material) {
    const numDiagonais = Math.floor(vao / 2)

    // Banzo inferior
    const banzoInf = createTubeProfile(0.2, vao, 0.15)
    banzoInf.material = material
    banzoInf.rotation.z = Math.PI / 2
    banzoInf.position.set(0, altura, zPos)
    banzoInf.castShadow = true
    structureGroup.add(banzoInf)

    // Banzo superior esquerdo
    const banzoSupEsq = createTubeProfile(0.2, vao / 2, 0.15)
    banzoSupEsq.material = material
    banzoSupEsq.rotation.z = Math.PI / 2 + Math.atan(altura / (vao / 2))
    banzoSupEsq.position.set(-vao / 4, altura + altura / 2, zPos)
    banzoSupEsq.castShadow = true
    structureGroup.add(banzoSupEsq)

    // Banzo superior direito
    const banzoSupDir = createTubeProfile(0.2, vao / 2, 0.15)
    banzoSupDir.material = material
    banzoSupDir.rotation.z = Math.PI / 2 - Math.atan(altura / (vao / 2))
    banzoSupDir.position.set(vao / 4, altura + altura / 2, zPos)
    banzoSupDir.castShadow = true
    structureGroup.add(banzoSupDir)

    // Diagonais e montantes
    for (let i = 0; i < numDiagonais; i++) {
        const xPos = (-vao / 2) + (i * vao / numDiagonais)

        const diagonal = createTubeProfile(0.15, 2, 0.1)
        diagonal.material = material
        diagonal.rotation.z = Math.PI / 4
        diagonal.position.set(xPos + vao / (numDiagonais * 2), altura + altura / 4, zPos)
        diagonal.castShadow = true
        structureGroup.add(diagonal)
    }
}

/**
 * Cria terças de cobertura
 */
function createTercas(data: ProjectData, material: THREE.Material) {
    const numTercas = Math.floor(data.vao / 1.5)

    for (let i = 0; i < numTercas; i++) {
        const xPos = (-data.vao / 2) + (i * data.vao / numTercas)
        const altura = data.altura + Math.abs(xPos) * data.inclinacao / 100

        const terca = createTubeProfile(0.15, data.comprimento, 0.12)
        terca.material = material
        terca.rotation.x = Math.PI / 2
        terca.position.set(xPos, altura, 0)
        structureGroup.add(terca)
    }
}

/**
 * Cria contraventamento
 */
function createContraventamento(data: ProjectData) {
    const { vao, comprimento, altura } = data

    // Contraventamento de cobertura
    const contraMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.6,
        metalness: 0.6,
        transparent: true,
        opacity: 0.7
    })

    const numContra = 4
    for (let i = 0; i < numContra; i++) {
        const zPos = (-comprimento / 2) + (i * comprimento / numContra)

        const contra = createTubeProfile(0.1, vao * 1.2, 0.08)
        contra.material = contraMat
        contra.rotation.set(0, 0, Math.PI / 6)
        contra.position.set(0, altura, zPos)
        structureGroup.add(contra)
    }
}

/**
 * Cria fechamento lateral
 */
function createFechamento(data: ProjectData) {
    const { vao, comprimento, altura, fechamento } = data

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.7,
        metalness: 0.3,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    })

    // Fechamento lateral esquerdo
    if (fechamento === 'completo' || fechamento === 'parcial') {
        const wallLeft = new THREE.Mesh(
            new THREE.PlaneGeometry(comprimento, altura),
            wallMaterial
        )
        wallLeft.position.set(-vao / 2, altura / 2, 0)
        wallLeft.rotation.y = Math.PI / 2
        structureGroup.add(wallLeft)
    }

    // Fechamento lateral direito
    if (fechamento === 'completo') {
        const wallRight = new THREE.Mesh(
            new THREE.PlaneGeometry(comprimento, altura),
            wallMaterial
        )
        wallRight.position.set(vao / 2, altura / 2, 0)
        wallRight.rotation.y = -Math.PI / 2
        structureGroup.add(wallRight)
    }

    // Fechamento dos oitões
    const oitaoGeometry = createOitaoGeometry(vao, altura, data.inclinacao)

    const oitaoFront = new THREE.Mesh(oitaoGeometry, wallMaterial)
    oitaoFront.position.set(0, 0, comprimento / 2)
    structureGroup.add(oitaoFront)

    const oitaoBack = new THREE.Mesh(oitaoGeometry, wallMaterial)
    oitaoBack.position.set(0, 0, -comprimento / 2)
    oitaoBack.rotation.y = Math.PI
    structureGroup.add(oitaoBack)
}

/**
 * Cria geometria do oitão (formato triangular no topo)
 */
function createOitaoGeometry(vao: number, altura: number, inclinacao: number): THREE.BufferGeometry {
    const alturaOitao = (vao * inclinacao / 200)
    const shape = new THREE.Shape()

    shape.moveTo(-vao / 2, 0)
    shape.lineTo(vao / 2, 0)
    shape.lineTo(vao / 2, altura)
    shape.lineTo(0, altura + alturaOitao)
    shape.lineTo(-vao / 2, altura)
    shape.lineTo(-vao / 2, 0)

    return new THREE.ShapeGeometry(shape)
}

/**
 * Cria perfil I (viga)
 */
function createIBeam(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    return new THREE.Mesh(geometry)
}

/**
 * Cria perfil tubular
 */
function createTubeProfile(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth)
    return new THREE.Mesh(geometry)
}

/**
 * Centraliza câmera na estrutura
 */
function centerCameraOnStructure(data: ProjectData) {
    const distance = Math.max(data.vao, data.comprimento) * 1.5
    camera.position.set(distance * 0.7, distance * 0.5, distance * 0.7)
    controls.target.set(0, data.altura / 2, 0)
    controls.update()
}

/**
 * Configura controles do visualizador
 */
function setupViewerControls() {
    // Auto-rotate
    document.getElementById('btn-rotate')?.addEventListener('click', () => {
        autoRotate = !autoRotate
        controls.autoRotate = autoRotate
    })

    // Reset view
    document.getElementById('btn-reset-view')?.addEventListener('click', () => {
        camera.position.set(40, 30, 40)
        controls.target.set(0, 0, 0)
        controls.update()
    })

    // Wireframe toggle
    document.getElementById('btn-wireframe')?.addEventListener('click', () => {
        wireframeMode = !wireframeMode
        structureGroup.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.wireframe = wireframeMode
            }
        })
    })
}

/**
 * Handle window resize
 */
function onWindowResize() {
    if (!canvas || !camera || !renderer) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight

    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate)

    controls.update()
    renderer.render(scene, camera)
}
