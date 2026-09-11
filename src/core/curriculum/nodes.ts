import { CurriculumNode } from '@/types/curriculum';
import { getSubModulesForNode } from './submodules';

const RAW_CURRICULUM_NODES: CurriculumNode[] = [
  // ==========================================
  // TIER 0: Álgebra e Trigonometria Operacional
  // ==========================================
  {
    id: 't0_algebra_fma',
    tier: 0,
    title: 'Fatoração Algébrica e FMA em Shaders',
    category: 'algebra_trigonometry',
    mathFoundation: 'Manipulação de polinômios, produtos notáveis e fatoração racional direcionada à minimização de ciclos de GPU.',
    graphicApplication: 'Instruções FMA (Fused Multiply-Add: a * b + c) executadas em 1 único ciclo de clock nas ALUs da placa de vídeo.',
    prerequisites: [],
    latexFormulas: [
      'f(x) = ax^2 + bx + c = x(ax + b) + c \\quad \\text{(Forma de Horner / FMA)}',
      '\\text{mad}(a, b, c) = a \\cdot b + c'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    // Horner evaluation for polynomial curve
    float y = uv.x * (uv.x * 0.8 - 0.2) - 0.3;
    float dist = abs(uv.y - y);
    float intensity = smoothstep(0.02, 0.0, dist);
    fragColor = vec4(vec3(0.0, 0.94, 1.0) * intensity, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 100, y: 150 }
  },
  {
    id: 't0_trig_polar',
    tier: 0,
    title: 'Trigonometria Analítica e Coordenadas Polares',
    category: 'algebra_trigonometry',
    mathFoundation: 'Círculo trigonométrico, identidades fundamentais, projeções ortogonais e conversão cartesiano-polar (r, θ).',
    graphicApplication: 'Geração de padrões radiais, vórtices, distorções de lente fisheye e matrizes de rotação 2D no fragment shader.',
    prerequisites: ['t0_algebra_fma'],
    latexFormulas: [
      'r = \\sqrt{x^2 + y^2}, \\quad \\theta = \\text{atan2}(y, x)',
      'R(\\theta) = \\begin{bmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{bmatrix}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    float theta = atan(uv.y, uv.x);
    // Radial wave pattern
    float wave = sin(r * 15.0 - u_time * 4.0 + theta * 5.0);
    vec3 col = vec3(0.0, 0.94, 1.0) * (wave * 0.5 + 0.5);
    fragColor = vec4(col, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 280, y: 150 }
  },
  {
    id: 't0_coords_ndc',
    tier: 0,
    title: 'Espaços de Coordenadas e Mapeamento UV',
    category: 'algebra_trigonometry',
    mathFoundation: 'Transformações afins 1D e 2D, mapeamento de intervalos [a, b] -> [c, d] e correção de proporção de aspecto (aspect ratio).',
    graphicApplication: 'Conversão de gl_FragCoord (pixels de tela) para Normalized Device Coordinates (NDC: [-1, 1]) e espaço de textura UV [0, 1].',
    prerequisites: ['t0_algebra_fma'],
    latexFormulas: [
      'uv = \\frac{p - a}{b - a}, \\quad \\text{NDC} = 2 \\cdot \\text{UV} - 1',
      'p_{\\text{aspect}} = \\frac{2 \\cdot \\mathbf{x} - \\mathbf{res}}{\\min(\\mathbf{res}_x, \\mathbf{res}_y)}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    // Normalization with aspect ratio preservation
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    // Grid coordinate visualizer
    vec2 grid = abs(fract(uv * 4.0 - 0.5) - 0.5) / fwidth(uv * 4.0);
    float line = min(grid.x, grid.y);
    float c = 1.0 - min(line, 1.0);
    fragColor = vec4(vec3(c * 0.4, c * 0.8, c * 1.0), 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 460, y: 150 }
  },

  // ==========================================
  // TIER 1: Álgebra Linear e Transformações 3D
  // ==========================================
  {
    id: 't1_vectors_dot',
    tier: 1,
    title: 'Vetores, Produto Escalar e Iluminação Lambertiana',
    category: 'linear_algebra',
    mathFoundation: 'Espaço euclidiano ℝ³, norma L2, projeção ortogonal e produto interno dot(u, v) = ||u|| ||v|| cos(θ).',
    graphicApplication: 'Lei do Cosseno de Lambert para reflexão difusa em superfícies opacas: I = max(0.0, dot(N, L)).',
    prerequisites: ['t0_coords_ndc', 't0_trig_polar'],
    latexFormulas: [
      '\\mathbf{u} \\cdot \\mathbf{v} = \\sum_{i=1}^3 u_i v_i = \\|\\mathbf{u}\\| \\|\\mathbf{v}\\| \\cos\\theta',
      'I_{\\text{diffuse}} = k_d \\cdot \\max(0, \\mathbf{N} \\cdot \\mathbf{L})'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r > 0.8) {
        fragColor = vec4(0.04, 0.05, 0.07, 1.0);
        return;
    }
    // Hemisphere normal
    float z = sqrt(0.8 * 0.8 - r * r);
    vec3 N = normalize(vec3(uv, z));
    vec3 L = normalize(vec3(cos(u_time), sin(u_time), 1.0));
    float diff = max(0.0, dot(N, L));
    vec3 col = vec3(0.0, 0.94, 1.0) * diff + vec3(0.05, 0.08, 0.12);
    fragColor = vec4(col, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 190, y: 320 }
  },
  {
    id: 't1_vectors_cross_tbn',
    tier: 1,
    title: 'Produto Vetorial e Matriz TBN (Normal Mapping)',
    category: 'linear_algebra',
    mathFoundation: 'Orientação no espaço, produto vetorial ortogonal u × v e construção de bases ortonormais via processo de Gram-Schmidt.',
    graphicApplication: 'Matriz Tangente-Bitangente-Normal (TBN) para transformar normais lidas de texturas para espaço de mundo ou visão.',
    prerequisites: ['t1_vectors_dot'],
    latexFormulas: [
      '\\mathbf{u} \\times \\mathbf{v} = (u_y v_z - u_z v_y, u_z v_x - u_x v_z, u_x v_y - u_y v_x)',
      '\\mathbf{B} = \\mathbf{N} \\times \\mathbf{T}, \\quad M_{\\text{TBN}} = [\\mathbf{T} \\quad \\mathbf{B} \\quad \\mathbf{N}]'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec3 N = vec3(0.0, 0.0, 1.0);
    vec3 T = vec3(1.0, 0.0, 0.0);
    vec3 B = cross(N, T);
    // Perturb normal using sin waves
    vec3 bump = normalize(vec3(sin(uv.x * 12.0) * 0.5, cos(uv.y * 12.0) * 0.5, 1.0));
    mat3 TBN = mat3(T, B, N);
    vec3 worldNormal = normalize(TBN * bump);
    fragColor = vec4(worldNormal * 0.5 + 0.5, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 370, y: 320 }
  },
  {
    id: 't1_matrix_mvp',
    tier: 1,
    title: 'Matrizes 4x4 e Pipeline MVP (Model-View-Projection)',
    category: 'linear_algebra',
    mathFoundation: 'Coordenadas homogêneas (x, y, z, w), transformações afins projetivas e divisão de perspectiva (perspective divide por w).',
    graphicApplication: 'Conversão de vértices do espaço local de objeto para espaço de mundo, visão de câmera e espaço de recorte (Clip Space).',
    prerequisites: ['t1_vectors_dot'],
    latexFormulas: [
      '\\mathbf{p}_{\\text{clip}} = M_{\\text{proj}} \\cdot M_{\\text{view}} \\cdot M_{\\text{model}} \\cdot \\begin{bmatrix} x \\\\ y \\\\ z \\\\ 1 \\end{bmatrix}',
      '\\mathbf{p}_{\\text{ndc}} = \\frac{\\mathbf{p}_{\\text{clip}.xyz}}{\\mathbf{p}_{\\text{clip}.w}}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

mat4 rotationY(float angle) {
    return mat4(cos(angle), 0, sin(angle), 0,  0, 1, 0, 0,  -sin(angle), 0, cos(angle), 0,  0, 0, 0, 1);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    mat4 rot = rotationY(u_time);
    vec4 testVec = rot * vec4(1.0, 0.0, 0.0, 1.0);
    fragColor = vec4(testVec.xyz * 0.5 + 0.5, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 550, y: 320 }
  },
  {
    id: 't1_quaternions_slerp',
    tier: 1,
    title: 'Quatérnions e Rotações sem Gimbal Lock',
    category: 'linear_algebra',
    mathFoundation: 'Álgebra de quatérnions ℍ (w + xi + yj + zk com i²=j²=k²=ijk=-1), quatérnions unitários e interpolação esférica Slerp.',
    graphicApplication: 'Orientação de câmeras de voo livre (6 DOF), animação esquelética e transformações suaves em motores de jogos.',
    prerequisites: ['t1_matrix_mvp'],
    latexFormulas: [
      'q = \\left(\\cos\\frac{\\theta}{2}, \\mathbf{v} \\sin\\frac{\\theta}{2}\\right)',
      '\\text{Slerp}(q_1, q_2, t) = \\frac{\\sin((1-t)\\Omega)}{\\sin\\Omega} q_1 + \\frac{\\sin(t\\Omega)}{\\sin\\Omega} q_2'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

vec4 quatFromAxisAngle(vec3 axis, float angle) {
    return vec4(axis * sin(angle * 0.5), cos(angle * 0.5));
}

vec3 rotateVector(vec4 q, vec3 v) {
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec4 q = quatFromAxisAngle(vec3(0.0, 1.0, 0.0), u_time);
    vec3 v = rotateVector(q, vec3(uv, 0.5));
    fragColor = vec4(normalize(v) * 0.5 + 0.5, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 730, y: 320 }
  },

  // ==========================================
  // TIER 2: Cálculo Diferencial e SDFs
  // ==========================================
  {
    id: 't2_partial_derivatives',
    tier: 2,
    title: 'Derivadas Parciais e Vetor Gradiente',
    category: 'differential_calculus',
    mathFoundation: 'Definição formal de derivadas parciais ∂f/∂x, ∂f/∂y, vetor gradiente ∇f e direção de máxima variação de campos escalares.',
    graphicApplication: 'Determinação analítica da inclinação de superfícies e funções de relevo (heightmaps) em shaders de terreno.',
    prerequisites: ['t1_vectors_dot'],
    latexFormulas: [
      '\\nabla f(x, y, z) = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z} \\right)',
      'D_{\\mathbf{u}} f(p) = \\nabla f(p) \\cdot \\mathbf{u}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

// Scalar field f(x, y) = sin(x) * cos(y)
float field(vec2 p) {
    return sin(p.x * 3.0 + u_time) * cos(p.y * 3.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 eps = vec2(0.001, 0.0);
    // Analytical gradient approximation
    float gradX = (field(uv + eps.xy) - field(uv - eps.xy)) / (2.0 * eps.x);
    float gradY = (field(uv + eps.yx) - field(uv - eps.yx)) / (2.0 * eps.x);
    vec2 grad = vec2(gradX, gradY);
    fragColor = vec4(normalize(vec3(grad, 1.0)) * 0.5 + 0.5, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 280, y: 500 }
  },
  {
    id: 't2_sdf_raymarching',
    tier: 2,
    title: 'Campos de Distância com Sinal (SDFs) e Ray Marching',
    category: 'differential_calculus',
    mathFoundation: 'Conjuntos de nível zero {p | f(p) = 0}, propriedades métricas de funções de Lipschitz com constante 1 (||∇f|| = 1).',
    graphicApplication: 'Renderização volumétrica por marcha de esferas (Sphere Tracing) para renderizar geometrias implícitas complexas sem polígonos.',
    prerequisites: ['t2_partial_derivatives'],
    latexFormulas: [
      'f_{\\text{sphere}}(p, r) = \\|p\\| - r',
      'p_{k+1} = p_k + f(p_k) \\cdot \\mathbf{d}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

float map(vec3 p) {
    return length(p) - 1.0; // Sphere SDF of radius 1.0
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.5));
    float t = 0.0;
    for(int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if(d < 0.001) break;
        t += d;
        if(t > 10.0) break;
    }
    vec3 col = (t < 10.0) ? vec3(0.0, 0.94, 1.0) * (1.0 - t / 6.0) : vec3(0.04, 0.05, 0.07);
    fragColor = vec4(col, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 460, y: 500 }
  },
  {
    id: 't2_tetrahedron_normals',
    tier: 2,
    title: 'Normais de SDF e Técnica do Tetraedro',
    category: 'differential_calculus',
    mathFoundation: 'Aproximação de diferenças finitas centradas e simetria tetraédrica para redução do número de avaliações de campos escalares.',
    graphicApplication: 'Cálculo de normais de superfícies em Ray Marching com apenas 4 amostragens de SDF em vez de 6 amostragens ortogonais.',
    prerequisites: ['t2_sdf_raymarching'],
    latexFormulas: [
      '\\mathbf{N} = \\frac{\\nabla f(p)}{\\|\\nabla f(p)\\|}',
      '\\mathbf{N} \\approx \\sum_{i=0}^3 \\mathbf{k}_i f(p + h \\mathbf{k}_i), \\quad \\mathbf{k}_0 = (1, -1, -1), \\mathbf{k}_1 = (-1, -1, 1), \\dots'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

float map(vec3 p) {
    return length(p) - 1.0;
}

vec3 calcNormal(vec3 p) {
    const vec2 k = vec2(1.0, -1.0);
    const float h = 0.0005;
    return normalize(
        k.xyy * map(p + k.xyy * h) +
        k.yyx * map(p + k.yyx * h) +
        k.yxy * map(p + k.yxy * h) +
        k.xxx * map(p + k.xxx * h)
    );
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.5));
    float t = 0.0;
    for(int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if(d < 0.001) break;
        t += d;
        if(t > 10.0) break;
    }
    vec3 col = vec3(0.04, 0.05, 0.07);
    if(t < 10.0) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 l = normalize(vec3(1.0, 1.5, -1.0));
        float diff = max(0.0, dot(n, l));
        col = vec3(0.0, 0.94, 1.0) * diff + vec3(0.05, 0.1, 0.15);
    }
    fragColor = vec4(col, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 640, y: 500 }
  },
  {
    id: 't2_hessian_ao',
    tier: 2,
    title: 'Matriz Hessiana, Curvatura e Oclusão de Ambiente',
    category: 'differential_calculus',
    mathFoundation: 'Derivadas de segunda ordem, traço e autovalores da matriz Hessiana H_f(p) determinando curvatura média H e Gaussiana K.',
    graphicApplication: 'Oclusão de ambiente (AO) analítica e renderização de silhuetas baseadas na convexidade local de superfícies.',
    prerequisites: ['t2_tetrahedron_normals'],
    latexFormulas: [
      'H(f) = \\begin{bmatrix} \\frac{\\partial^2 f}{\\partial x^2} & \\frac{\\partial^2 f}{\\partial x \\partial y} & \\frac{\\partial^2 f}{\\partial x \\partial z} \\\\ \\dots & \\dots & \\dots \\end{bmatrix}',
      '\\text{AO}(p, \\mathbf{N}) = 1.0 - \\sum_{i=1}^k \\frac{1}{2^i} (i \\cdot d - f(p + i \\cdot d \\cdot \\mathbf{N}))'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

float map(vec3 p) { return length(p) - 1.0; }

float calcAO(vec3 p, vec3 n) {
    float occ = 0.0;
    float sca = 1.0;
    for(int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = map(p + h * n);
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    fragColor = vec4(vec3(0.0, 0.94, 1.0) * (1.0 - length(uv) * 0.5), 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 820, y: 500 }
  },

  // ==========================================
  // TIER 3: Cálculo Integral e Radiometria Física
  // ==========================================
  {
    id: 't3_beer_lambert',
    tier: 3,
    title: 'Integrais de Linha e Lei de Beer-Lambert (Volumétricos)',
    category: 'integral_calculus',
    mathFoundation: 'Integrais de linha de campos escalares ao longo de trajetórias lineares e equação diferencial de atenuação dI/ds = -σ_t I.',
    graphicApplication: 'Transmissão de luz em meios participativos físicos (névoa, fumaça, água profunda e dispersão subsuperficial - SSS).',
    prerequisites: ['t2_sdf_raymarching'],
    latexFormulas: [
      'T(s) = \\exp\\left( -\\int_0^s \\sigma_t(x(t)) \\, dt \\right)',
      'I(s) = I_0 \\cdot e^{-\\sigma_t \\cdot s} \\quad \\text{(Caso homogêneo)}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float depth = clamp(uv.x + 1.0, 0.0, 2.0);
    // Beer-Lambert transmittance for RGB extinction coefficients
    vec3 sigma = vec3(0.8, 0.3, 0.1);
    vec3 T = exp(-sigma * depth * 3.0);
    fragColor = vec4(T, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 370, y: 680 }
  },
  {
    id: 't3_solid_angle',
    tier: 3,
    title: 'Integrais sobre Semiesferas e Ângulo Sólido',
    category: 'integral_calculus',
    mathFoundation: 'Geometria esférica, elemento diferencial de ângulo sólido dω = sin(θ) dθ dφ e projeção sobre o disco unitário.',
    graphicApplication: 'Integração de irradiância incidente a partir do ambiente sobre o hemisfério superior de uma superfície.',
    prerequisites: ['t3_beer_lambert', 't1_vectors_dot'],
    latexFormulas: [
      'd\\omega = \\frac{dA}{r^2} = \\sin\\theta \\, d\\theta \\, d\\phi',
      'E = \\int_{\\Omega} L_i(\\omega_i) \\cos\\theta \\, d\\omega_i'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    if (r > 1.0) { fragColor = vec4(0.04, 0.05, 0.07, 1.0); return; }
    float cosTheta = sqrt(1.0 - r * r);
    fragColor = vec4(vec3(cosTheta), 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 550, y: 680 }
  },
  {
    id: 't3_kajiya_equation',
    tier: 3,
    title: 'A Equação de Renderização de Kajiya',
    category: 'integral_calculus',
    mathFoundation: 'Equações integrais de Fredholm de segundo tipo e balanço de conservação de energia radiométrica contínua.',
    graphicApplication: 'O fundamento absoluto de todo renderizador físico (Path Tracer) moderno e motores gráficos PBR.',
    prerequisites: ['t3_solid_angle'],
    latexFormulas: [
      'L_o(p, \\omega_o) = L_e(p, \\omega_o) + \\int_{\\Omega} f_r(p, \\omega_i, \\omega_o) L_i(p, \\omega_i) (\\omega_i \\cdot \\mathbf{n}) \\, d\\omega_i',
      '\\int_{\\Omega} f_r(p, \\omega_i, \\omega_o) (\\omega_i \\cdot \\mathbf{n}) \\, d\\omega_i \\le 1 \\quad \\text{(Conservação de Energia)}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec3 Lo = vec3(0.0, 0.94, 1.0) * (0.5 + 0.5 * sin(uv.x * 4.0 + u_time));
    fragColor = vec4(Lo, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 730, y: 680 }
  },
  {
    id: 't3_cook_torrance_brdf',
    tier: 3,
    title: 'BRDF Cook-Torrance e Integração de Monte Carlo',
    category: 'integral_calculus',
    mathFoundation: 'Teoria estatística de microfacetas (GGX/Trowbridge-Reitz), termos de Fresnel Schlick e estimador de Monte Carlo.',
    graphicApplication: 'Modelagem de reflexão especular fisicamente correta em metais e dielétricos (Unreal Engine PBR / Frostbite).',
    prerequisites: ['t3_kajiya_equation'],
    latexFormulas: [
      'f_r = \\frac{D(\\mathbf{h}) \\cdot F(\\mathbf{v}, \\mathbf{h}) \\cdot G(\\mathbf{l}, \\mathbf{v}, \\mathbf{h})}{4 (\\mathbf{n} \\cdot \\mathbf{l}) (\\mathbf{n} \\cdot \\mathbf{v})}',
      'I_N = \\frac{1}{N} \\sum_{i=1}^N \\frac{f(X_i)}{p(X_i)} \\quad \\text{(Estimador de Monte Carlo)}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

// GGX Normal Distribution Function
float D_GGX(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (3.14159265 * denom * denom);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float roughness = clamp(uv.y * 0.5 + 0.5, 0.05, 1.0);
    float ndoth = clamp(1.0 - abs(uv.x), 0.0, 1.0);
    float spec = D_GGX(ndoth, roughness);
    fragColor = vec4(vec3(spec * 0.5), 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 910, y: 680 }
  },

  // ==========================================
  // TIER 4: Campos Vetoriais e Tensores Básicos
  // ==========================================
  {
    id: 't4_divergence_fluids',
    tier: 4,
    title: 'Divergente e Fluidos Incompressíveis na GPU',
    category: 'vector_fields_tensors',
    mathFoundation: 'Operador del dot F = div(F), Teorema da Divergência de Gauss e condição de incompressibilidade ∇ · u = 0.',
    graphicApplication: 'Passo de projeção de Poisson em simulação de fluidos em tempo real via fragment shaders e compute shaders.',
    prerequisites: ['t2_partial_derivatives'],
    latexFormulas: [
      '\\nabla \\cdot \\mathbf{F} = \\frac{\\partial F_x}{\\partial x} + \\frac{\\partial F_y}{\\partial y} + \\frac{\\partial F_z}{\\partial z}',
      '\\iiint_V (\\nabla \\cdot \\mathbf{F}) \\, dV = \\iint_S (\\mathbf{F} \\cdot \\mathbf{n}) \\, dS'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    // Radial divergent field F(x, y) = (x, y) => div = 2
    float div = 2.0;
    fragColor = vec4(vec3(0.0, 0.94, 1.0) * (div * 0.25), 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 460, y: 860 }
  },
  {
    id: 't4_curl_vorticity',
    tier: 4,
    title: 'Rotacional, Teorema de Stokes e Vorticidade',
    category: 'vector_fields_tensors',
    mathFoundation: 'Operador rotacional del x F = curl(F), circulação de campos vetoriais e confinamento de vorticidade.',
    graphicApplication: 'Preservação de turbulência e redemoinhos em simulações de fumaça e fogo que tendem a se dissipar numericamente.',
    prerequisites: ['t4_divergence_fluids'],
    latexFormulas: [
      '\\nabla \\times \\mathbf{F} = \\left( \\frac{\\partial F_z}{\\partial y} - \\frac{\\partial F_y}{\\partial z}, \\frac{\\partial F_x}{\\partial z} - \\frac{\\partial F_z}{\\partial x}, \\frac{\\partial F_y}{\\partial x} - \\frac{\\partial F_x}{\\partial y} \\right)',
      '\\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot \\mathbf{n} \\, dS'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    // Vortex field F(x, y) = (-y, x)
    vec2 field = vec2(-uv.y, uv.x);
    float curl = 2.0; // Constant curl in 2D
    fragColor = vec4(vec3(curl * 0.3, 0.8, 1.0) * length(field), 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 640, y: 860 }
  },
  {
    id: 't4_stress_tensors',
    tier: 4,
    title: 'Tensores de Deformação e Refração Anisotrópica',
    category: 'vector_fields_tensors',
    mathFoundation: 'Tensores de segunda ordem, notação indicial de Einstein, autovalores principais e elipsoides de deformação Cauchy.',
    graphicApplication: 'Renderização de materiais com índices de refração dependentes de direção (birrefringência em cristais e tecidos esticados).',
    prerequisites: ['t1_matrix_mvp', 't2_partial_derivatives'],
    latexFormulas: [
      '\\sigma_{ij} = C_{ijkl} \\, \\varepsilon_{kl}',
      '\\mathbf{T}^{(\\mathbf{n})} = \\sigma \\cdot \\mathbf{n} \\quad \\text{(Vetor de Tração de Cauchy)}'
    ],
    defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    // Anisotropic stress ellipse visualization
    float a = 2.0 + sin(u_time);
    float b = 1.0;
    float val = (uv.x * uv.x) * a + (uv.y * uv.y) * b;
    float line = smoothstep(0.03, 0.0, abs(val - 0.5));
    fragColor = vec4(vec3(1.0, 0.7, 0.0) * line, 1.0);
}`,
    targetScoreKnowledge: 90,
    targetScore3D: 10,
    gridPosition: { x: 820, y: 860 }
  }
];

export const CURRICULUM_NODES: CurriculumNode[] = RAW_CURRICULUM_NODES.map((node) => ({
  ...node,
  submodules: getSubModulesForNode(node.id, node.title),
}));
