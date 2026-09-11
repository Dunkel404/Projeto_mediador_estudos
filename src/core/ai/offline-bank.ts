import { LessonAndAssessmentResponse } from '../../types/ai-contract';

export const OFFLINE_STRESS_BANK: Record<string, LessonAndAssessmentResponse> = {
  t0_algebra_fma: {
    session_id: 'offline_t0_fma_01',
    topic: {
      title: 'Otimização de Polinômios e FMA em Fragment Shaders',
      math_foundation: 'Todo polinômio de grau n pode ser reescrito na forma aninhada de Horner: P(x) = (...((a_n x + a_{n-1})x + a_{n-2})...) + a_0, reduzindo multiplicações de O(n²) para O(n).',
      graphic_application: 'Hardware de GPU executa FMA (Fused Multiply-Add) em ciclo único, dobrando o throughput de cálculos de cor e interpolação de curvas.',
    },
    didactic_article: {
      title: 'A Mecânica Algébrica da Fatoração e a Instrução FMA nas GPUs Modernas',
      subtitle: 'Como a Teoria da Carga Cognitiva e a Decomposição de Horner Maximizam o Throughput das ALUs',
      read_time_minutes: 7,
      scientific_pedagogy_note: 'Ancoragem Cognitiva (Sweller): Redução da carga extrínseca ao unificar a representação polinomial abstrata com o circuito de hardware físico da GPU (Fused Multiply-Add).',
      historical_context: 'No início da computação gráfica na década de 1970, cada multiplicação de ponto flutuante custava múltiplos ciclos de clock. William George Horner formalizou em 1819 o método que hoje é a base da microarquitetura de GPUs para avaliação de curvas de Bézier e Splines.',
      geometric_intuition: 'Pense em avaliar ax² + bx + c não como áreas de quadrados que se somam separadamente, mas como uma transformação linear acumulada: você escala x por a, translada por b, re-escala pelo x original e translada por c.',
      mathematical_derivation_latex: [
        'P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_1 x + a_0',
        'P(x) = a_0 + x(a_1 + x(a_2 + \\dots + x(a_{n-1} + a_n x)\\dots)) \\quad \\text{(Regra de Horner)}',
        '\\text{FMA}(a, b, c) = a \\cdot b + c \\quad \\text{(Executado com arredondamento único e zero penalidade de clock)}'
      ],
      graphics_engine_pipeline: 'Nas unidades de processamento de stream (ALUs da NVIDIA/AMD), instruções do tipo MAD ou FMA operam em registradores dedicados de 32 bits em precisão IEEE 754-2008 sem armazenar o resultado intermediário da multiplicação.',
      curated_references: {
        papers_and_books: [
          {
            title: 'Real-Time Rendering, 4th Edition',
            author: 'Tomas Akenine-Möller, Eric Haines, Naty Hoffman',
            year: '2018',
            description: 'Capítulo 3: The Graphics Processing Unit — Arquitetura de ALUs e instruções vetoriais.',
            url: 'https://www.realtimerendering.com'
          },
          {
            title: 'Handbook of Floating-Point Arithmetic',
            author: 'Jean-Michel Muller et al.',
            year: '2018',
            description: 'Análise de erro numérico em operações Fused Multiply-Add versus pares separados de mult/add.'
          }
        ],
        videos_and_talks: [
          {
            title: 'How GPUs Actually Work Under the Hood',
            channel_or_speaker: 'Branch Education',
            key_takeaway: 'Visualização 3D das ALUs de GPU executando FMA paralelamente em milhares de threads.',
            search_query_or_url: 'https://www.youtube.com/results?search_query=Branch+Education+GPU'
          },
          {
            title: 'The Essence of Calculus & Horner Form',
            channel_or_speaker: '3Blue1Brown',
            key_takeaway: 'Intuição geométrica de taxas de variação e aproximação polinomial de Taylor.',
            search_query_or_url: 'https://www.youtube.com/results?search_query=3blue1brown+calculus'
          }
        ],
        code_and_projects: [
          {
            name: 'Fast Polynomial Evaluation in GLSL',
            repository_or_shadertoy: 'https://www.shadertoy.com/view/4dX3zl',
            what_to_analyze: 'Observe como curvas paramétricas utilizam horner evaluation para desenhar perfis a 60 FPS sem branches condicionais.'
          }
        ]
      }
    },
    interactive_exercise: {
      type: 'ALGEBRAIC_MANIPULATION',
      statement_latex: '\\text{Dado o polinômio cúbico } P(x) = 4x^3 - 3x^2 + 2x - 7, \\text{ reescreva-o na forma aninhada de Horner: } ((a \\cdot x + b) \\cdot x + c) \\cdot x + d. \\text{ Forneça os coeficientes } a, b, c, d.',
      expected_variables: {
        a: '4',
        b: '-3',
        c: '2',
        d: '-7',
      },
      diagnostic_traps: [
        {
          trap_id: 'sign_error',
          condition: 'b == 3 || d == 7',
          feedback: 'Erro aritmético de sinal nos coeficientes independentes.',
        },
      ],
    },
    shader_sandbox_payload: {
      shader_type: 'fragment_glsl',
      boilerplate_glsl: `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

float hornerCubic(float x) {
    return ((4.0 * x - 3.0) * x + 2.0) * x - 7.0;
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float y = hornerCubic(uv.x) * 0.05;
    float line = smoothstep(0.02, 0.0, abs(uv.y - y));
    fragColor = vec4(vec3(0.0, 0.94, 1.0) * line, 1.0);
}`,
      test_vectors: [{ input_p: [1.0, 0.0, 0.0], expected_normal: [0.0, 0.0, 1.0] }],
    },
    rubric_criteria: {
      minimum_score_to_advance: 85,
      time_threshold_seconds: 75,
    },
  },

  t1_vectors_dot: {
    session_id: 'offline_t1_dot_01',
    topic: {
      title: 'Balanço Energético e Lei de Lambert',
      math_foundation: 'A atenuação geométrica da irradiância recebida por uma superfície infinitesimal é proporcional ao cosseno do ângulo entre a normal N e o vetor de luz L: cos(θ) = (N · L) / (||N|| ||L||).',
      graphic_application: 'No fragment shader, se N ou L não forem normalizados unitariamente antes de dot(N, L), a iluminação estoura para valores > 1.0 ou falseia o gradiente especular.',
    },
    didactic_article: {
      title: 'A Lei do Cosseno de Lambert e a Projeção Ortogonal de Fótons',
      subtitle: 'Da Ótica Física de Johann Heinrich Lambert aos Shaders Difusos de Iluminação Local',
      read_time_minutes: 8,
      scientific_pedagogy_note: 'Modelo Mental de Feixe de Fótons: Visualize um tubo cilíndrico de raios de luz colidindo com uma placa inclinada. Quanto mais inclinada a placa, maior a área sobre a qual a mesma energia precisa se espalhar.',
      historical_context: 'Publicado na obra Photometria em 1760 por Johann Heinrich Lambert, este princípio governa a refletância de materiais puramente difusos (matte), onde a radiância refletida é isotrópica.',
      geometric_intuition: 'O produto escalar entre vetores normalizados mede o comprimento da sombra que um vetor projeta sobre o outro. Se o vetor de luz incide a 90° (paralelo à superfície), cos(90°) = 0 e a superfície não recebe fluxo luminoso.',
      mathematical_derivation_latex: [
        '\\mathbf{u} \\cdot \\mathbf{v} = \\|\\mathbf{u}\\| \\|\\mathbf{v}\\| \\cos\\theta = u_x v_x + u_y v_y + u_z v_z',
        'E = \\frac{\\Phi}{A \\cos\\theta} \\implies E_{\\text{incidente}} = E_0 \\max(0, \\hat{\\mathbf{N}} \\cdot \\hat{\\mathbf{L}})',
        '\\hat{\\mathbf{N}} = \\frac{\\mathbf{N}}{\\sqrt{N_x^2 + N_y^2 + N_z^2}} \\quad \\text{(Normalização Euclidiana Obrigatória)}'
      ],
      graphics_engine_pipeline: 'Executado no Fragment Shader. Os vetores normais interpolados pelo Rasterizer a partir dos vértices sofrem perda de magnitude e precisam OBRIGATORIAMENTE da instrução normalize() antes do dot().',
      curated_references: {
        papers_and_books: [
          {
            title: 'Physically Based Rendering: From Theory to Implementation (PBRT)',
            author: 'Matt Pharr, Wenzel Jakob, Greg Humphreys',
            year: '2023',
            description: 'Capítulo 5: Radiometry and Reflection — A dedução física completa da irradiância cos(θ).',
            url: 'https://pbrt.org'
          }
        ],
        videos_and_talks: [
          {
            title: 'Dot Products and Duality',
            channel_or_speaker: '3Blue1Brown (Essence of Linear Algebra)',
            key_takeaway: 'Compreensão geométrica visceral do produto escalar como transformações lineares para ℝ¹.',
            search_query_or_url: 'https://www.youtube.com/watch?v=LyGKycYT2v0'
          },
          {
            title: 'Lighting in Shaders: Diffuse Lambertian Reflection',
            channel_or_speaker: 'The Cherno',
            key_takeaway: 'Implementação prática em C++ e GLSL mostrando a diferença visual entre normais não normalizadas e normais puras.',
            search_query_or_url: 'https://www.youtube.com/results?search_query=The+Cherno+diffuse+lighting'
          }
        ],
        code_and_projects: [
          {
            name: 'Basic Lambertian Sphere Shader',
            repository_or_shadertoy: 'https://www.shadertoy.com/view/4dcGW2',
            what_to_analyze: 'Observe a linha max(0.0, dot(normal, lightDir)) e teste remover a normalização para ver o estouramento de fótons.'
          }
        ]
      }
    },
    interactive_exercise: {
      type: 'NUMERICAL_AND_SHADER_MECHANIC',
      statement_latex: '\\text{Sejam } \\mathbf{N} = (0, 3, 4) \\text{ e } \\mathbf{L} = (0, 5, 12). \\text{ Calcule o fator difuso normalizado } I = \\max(0, \\hat{\\mathbf{N}} \\cdot \\hat{\\mathbf{L}}).',
      expected_variables: {
        I: '0.969',
      },
      diagnostic_traps: [
        {
          trap_id: 'forgot_normalization',
          condition: 'I == 63',
          feedback: 'Você calculou N · L sem normalizar os vetores: ||N|| = 5 e ||L|| = 13, portanto o produto escalado é 63 / 65 ≈ 0.969.',
        },
      ],
    },
    rubric_criteria: {
      minimum_score_to_advance: 85,
      time_threshold_seconds: 60,
    },
  },

  t2_tetrahedron_normals: {
    session_id: 'offline_t2_tetra_01',
    topic: {
      title: 'Normais por Gradiente Numérico Tetraédrico',
      math_foundation: 'O gradiente ∇f(p) pode ser aproximado amostrando o campo de distâncias nos 4 vértices de um tetraedro regular circunscrito na esfera de raio h centrada em p.',
      graphic_application: 'Permite calcular sombras e normais analíticas em Ray Marching com 33% menos acessos à memória/ALU do que o método de 6 amostragens ortogonais.',
    },
    didactic_article: {
      title: 'Derivação Numérica em Superfícies Implícitas: A Elegância do Tetraedro',
      subtitle: 'Simetria Platônica no Espaço ℝ³ para Otimização Extrema de Ray Marching',
      read_time_minutes: 9,
      scientific_pedagogy_note: 'Alívio de Custo Computacional via Simetria: Em vez de avaliar os 6 eixos cartesianos (±x, ±y, ±z), exploramos a base ortogonal oblíqua de 4 vértices equidistantes.',
      historical_context: 'Desenvolvido por Inigo Quilez (co-criador do Shadertoy) e amplamente adotado na demoscene e produções como Pixar para renderização em tempo real de SDFs (Signed Distance Fields).',
      geometric_intuition: 'Imagine colocar 4 sensores nas 4 pontas de uma pirâmide triangular regular centrada no ponto de colisão. A soma ponderada das distâncias medidas aponta exatamente na direção de máxima subida (o vetor gradiente).',
      mathematical_derivation_latex: [
        '\\nabla f(p) \\approx \\frac{1}{2h} \\begin{bmatrix} f(p + he_x) - f(p - he_x) \\\\ f(p + he_y) - f(p - he_y) \\\\ f(p + he_z) - f(p - he_z) \\end{bmatrix} \\quad \\text{(Método Clássico: 6 amostragens)}',
        '\\mathbf{k}_0 = (1, -1, -1), \\; \\mathbf{k}_1 = (-1, -1, 1), \\; \\mathbf{k}_2 = (-1, 1, -1), \\; \\mathbf{k}_3 = (1, 1, 1)',
        '\\mathbf{N} = \\text{normalize}\\left( \\sum_{i=0}^3 \\mathbf{k}_i f(p + h \\mathbf{k}_i) \\right) \\quad \\text{(Método Tetraédrico: 4 amostragens)}'
      ],
      graphics_engine_pipeline: 'Em um shader de Ray Marching com resolução 1920x1080 a 60 FPS, passar de 6 para 4 amostras por pixel economiza mais de 250 milhões de avaliações de funções matemáticas pesadas por segundo.',
      curated_references: {
        papers_and_books: [
          {
            title: 'Normals for an SDF in Raymarching',
            author: 'Inigo Quilez',
            year: '2015',
            description: 'Artigo analítico canônico demonstrando a prova matemática da técnica do tetraedro.',
            url: 'https://iquilezles.org/articles/normalsSDF/'
          }
        ],
        videos_and_talks: [
          {
            title: 'Ray Marching for Dummies',
            channel_or_speaker: 'The Art of Code (Martijn Steinrucken)',
            key_takeaway: 'Construção passo a passo de raymarcher em GLSL e cálculo visual de normais.',
            search_query_or_url: 'https://www.youtube.com/watch?v=PGtv-dBi2wE'
          }
        ],
        code_and_projects: [
          {
            name: 'Tetrahedron Normal Benchmark',
            repository_or_shadertoy: 'https://www.shadertoy.com/view/Xds3zN',
            what_to_analyze: 'Código canônico de Raymarching de Inigo Quilez implementando a função calcNormal.'
          }
        ]
      }
    },
    interactive_exercise: {
      type: 'NUMERICAL_AND_SHADER_MECHANIC',
      statement_latex: '\\text{Quantas amostragens da SDF são executadas para calcular a normal de 1 pixel pelo método do tetraedro versus a diferença finita centrada tridimensional ortogonal? Calcule a economia percentual } E.',
      expected_variables: {
        amostragens_tetraedro: '4',
        amostragens_ortogonal: '6',
        economia_percentual: '33.3',
      },
      diagnostic_traps: [
        {
          trap_id: 'confused_counts',
          condition: 'amostragens_tetraedro == 3',
          feedback: 'Um tetraedro tridimensional possui 4 vértices, não 3.',
        },
      ],
    },
    rubric_criteria: {
      minimum_score_to_advance: 85,
      time_threshold_seconds: 60,
    },
  },

  t3_beer_lambert: {
    session_id: 'offline_t3_beer_01',
    topic: {
      title: 'Atenuação Volumétrica e Transmitância de Beer-Lambert',
      math_foundation: 'A lei diferencial dI/ds = -σ_t I integra para I(s) = I_0 exp(-σ_t s). Para meios heterogêneos, a transmitância é T = exp(-∫_0^s σ_t(x(t)) dt).',
      graphic_application: 'Calcula névoa, scattering subsuperficial e densidade de fumaça na marcha volumétrica de raios (Volume Ray Marching).',
    },
    didactic_article: {
      title: 'Integrais de Linha e Radiometria: A Lei Física de Beer-Lambert',
      subtitle: 'A Dedução Exponencial da Perda de Intensidade Ótica em Meios Participativos',
      read_time_minutes: 8,
      scientific_pedagogy_note: 'Análise de Equações Diferenciais Ordinárias: Relacionar a taxa de variação de fótons absorvidos com o conceito acumulativo da integral de caminho.',
      historical_context: 'Formulada conjuntamente pelas observações de Pierre Bouguer em 1729, Johann Lambert em 1760 e August Beer em 1852. Tornou-se o pilar fundamental de renderização volumétrica física no cinema e jogos.',
      geometric_intuition: 'A cada milímetro que a luz avança em uma xícara de café ou num bloco de vidro fumê, uma porcentagem fixa da energia restante é absorvida. Por isso a perda não é linear, mas exponencial.',
      mathematical_derivation_latex: [
        '\\frac{dI(s)}{ds} = -\\sigma_t I(s) \\implies \\frac{dI}{I} = -\\sigma_t \\, ds',
        '\\int_{I_0}^I \\frac{dI}{I} = -\\int_0^s \\sigma_t \\, ds \\implies \\ln\\left(\\frac{I}{I_0}\\right) = -\\sigma_t s',
        'T(s) = \\frac{I(s)}{I_0} = \\exp\\left( -\\int_0^s \\sigma_t(x(t)) \\, dt \\right)'
      ],
      graphics_engine_pipeline: 'No Volume Raymarching, o ray avança em pequenos passos dt, multiplicando a transmitância total pelo fator exp(-sigma * dt) a cada passo dentro do volume.',
      curated_references: {
        papers_and_books: [
          {
            title: 'Production Volume Rendering: Design and Implementation',
            author: 'Magnus Wrenninge',
            year: '2012',
            description: 'O livro de referência das equipes de efeitos visuais de Hollywood para marcha volumétrica.'
          }
        ],
        videos_and_talks: [
          {
            title: 'Volumetric Cloud Rendering in Real-Time',
            channel_or_speaker: 'Sebastian Lague',
            key_takeaway: 'Implementação visual de Beer-Lambert para nuvens volumétricas no Unity e shaders.',
            search_query_or_url: 'https://www.youtube.com/watch?v=4QOcCGI6x44'
          }
        ],
        code_and_projects: [
          {
            name: 'Atmospheric Fog and Volumetric Raymarcher',
            repository_or_shadertoy: 'https://www.shadertoy.com/view/WdKyDK',
            what_to_analyze: 'Analise a acumulação de transmitância utilizando a fórmula exponencial de extinção por canal de cor RGB.'
          }
        ]
      }
    },
    interactive_exercise: {
      type: 'NUMERICAL_AND_SHADER_MECHANIC',
      statement_latex: '\\text{Um raio de luz atravessa um volume homogêneo com coeficiente de extinção } \\sigma_t = 0.5 \\, \\text{m}^{-1} \\text{ ao longo de } s = 4 \\, \\text{metros}. \\text{ Calcule a transmitância final } T = e^{-\\sigma_t s}.',
      expected_variables: {
        T: '0.135',
      },
      diagnostic_traps: [
        {
          trap_id: 'positive_exponent',
          condition: 'T == 7.389',
          feedback: 'Erro de sinal no expoente: a luz decai com a distância (e^(-2)), não cresce.',
        },
      ],
    },
    rubric_criteria: {
      minimum_score_to_advance: 85,
      time_threshold_seconds: 60,
    },
  },
};

export function getOfflineAssessment(nodeId: string): LessonAndAssessmentResponse {
  if (OFFLINE_STRESS_BANK[nodeId]) {
    return OFFLINE_STRESS_BANK[nodeId];
  }

  // Fallback procedural assessment for any other node with rich didactic article
  return {
    session_id: `offline_proc_${nodeId}`,
    topic: {
      title: `Fundamentos Analíticos: ${nodeId}`,
      math_foundation: 'Fundamentos rigorosos de computação gráfica matemática aplicados a shaders.',
      graphic_application: 'Otimização e precisão visual em fragment shaders e pipelines 3D.',
    },
    didactic_article: {
      title: `Análise Matemática Profunda: ${nodeId}`,
      subtitle: 'Conexão Formal entre Álgebra, Cálculo e Pipelines de Shaders em Tempo Real',
      read_time_minutes: 6,
      scientific_pedagogy_note: 'Ancoragem Conceitual: Decomposição da transformação matemática em invariantes geométricos e restrições de ponto flutuante.',
      historical_context: 'Tópico fundamental da computação gráfica moderna e dos motores de renderização física.',
      geometric_intuition: 'Toda operação matricial ou diferencial define um mapa contínuo entre variedades no espaço euclidiano tridimensional.',
      mathematical_derivation_latex: [
        'f: \\mathbb{R}^n \\to \\mathbb{R}^m, \\quad \\mathbf{y} = f(\\mathbf{x})',
        '\\|\\mathbf{v}\\| = \\sqrt{\\sum_{i=1}^n v_i^2} \\quad \\text{(Norma Euclidiana Fundamental)}'
      ],
      graphics_engine_pipeline: 'Processado nos Compute e Fragment Shaders da GPU para cálculo de vértices, normais e iluminação.',
      curated_references: {
        papers_and_books: [
          {
            title: 'Mathematics for 3D Game Programming and Computer Graphics',
            author: 'Eric Lengyel',
            year: '2011',
            description: 'O texto definitivo para matemática de motores 3D.'
          }
        ],
        videos_and_talks: [
          {
            title: 'Essence of Linear Algebra & Calculus',
            channel_or_speaker: '3Blue1Brown',
            key_takeaway: 'Fundamentos geométricos e intuição de transformações no espaço.',
            search_query_or_url: 'https://www.youtube.com/c/3blue1brown'
          }
        ],
        code_and_projects: [
          {
            name: 'Shadertoy Computer Graphics Collection',
            repository_or_shadertoy: 'https://www.shadertoy.com',
            what_to_analyze: 'Explore implementações da técnica em shaders GLSL em tempo real.'
          }
        ]
      }
    },
    interactive_exercise: {
      type: 'NUMERICAL_AND_SHADER_MECHANIC',
      statement_latex: '\\text{Calcule o valor escalar resultante normalizado } V \\in [0, 1] \\text{ da transformação matemática correspondente ao nó.}',
      expected_variables: {
        V: '1.0',
      },
      diagnostic_traps: [
        {
          trap_id: 'default_trap',
          condition: 'V == 0',
          feedback: 'Verifique os limites assintóticos da função analítica.',
        },
      ],
    },
    rubric_criteria: {
      minimum_score_to_advance: 85,
      time_threshold_seconds: 90,
    },
  };
}
