import { SubModule } from '@/types/curriculum';

/**
 * Banco de Submódulos Sequenciais de Rigor Matemático Gradual
 * Cada nó possui uma cadeia de progressão:
 * 1. Base Formal Rigorosa (Baixo 3D: 25%) - Dificuldade analítica embutida, rigor de análise e álgebra abstrata.
 * 2. Transição Espacial & Vetorial (Médio 3D: 60%) - Projeções afins, cálculo multivariado e geometria diferencial.
 * 3. Shaders Avançados & Microarquitetura GPU (Alto 3D: 100%) - Fragment Shaders, Ray Marching, BRDF física e Kajiya.
 */

export const INITIAL_SUBMODULES: Record<string, SubModule[]> = {
  t0_algebra_fma: [
    {
      id: 't0_algebra_fma_sub1',
      moduleId: 't0_algebra_fma',
      order: 1,
      title: 'Aritmética de Ponto Flutuante IEEE-754 e Análise de Cancelamento Catastrófico',
      depthType: 'base_formal_baixo_3d',
      threeDApplicabilityWeight: 0.25,
      mathFoundation: 'A representação de ponto flutuante de 32 bits (IEEE 754) aloca 1 bit de sinal, 8 bits de expoente e 23 bits de mantissa fracionária: fl(x) = (-1)^s * (1.m) * 2^(e - 127). A subtração de grandezas quase idênticas causa perda severa de dígitos significativos (cancelamento catastrófico).',
      graphicApplication: 'Na GPU, operações como (1.0 - cos(x)) para ângulos diminutos produzem artefatos de quantização visíveis em dithering e gradientes de sombra antes de qualquer rasterização 3D.',
      latexFormulas: [
        '\\text{fl}(x) = x(1 + \\delta), \\quad |\\delta| \\le u = 2^{-24} \\approx 5.96 \\times 10^{-8}',
        '\\text{Erro}(\\tilde{x} - \\tilde{y}) = \\frac{|\\delta_x x - \\delta_y y|}{|x - y|} \\to \\infty \\quad \\text{conforme } x \\to y',
        '1 - \\cos(x) = 2\\sin^2\\left(\\frac{x}{2}\\right) \\quad \\text{(Estabilização Analítica via Taylor)}'
      ],
      didacticArticle: {
        title: 'Fundamentos Algébricos da Estabilidade Numérica em Ponto Flutuante',
        subtitle: 'Como o rigor analítico previne o colapso numérico antes da renderização de pixels',
        read_time_minutes: 8,
        scientific_pedagogy_note: 'Carga Cognitiva Intrínseca: Compreender que a matemática contínua real R não é isomórfica ao conjunto discreto de ponto flutuante F. O aluno deve dominar o erro relativo antes de manipular matrizes espaciais.',
        historical_context: 'Em 1985, William Kahan liderou o padrão IEEE 754 após desastres computacionais em simulações aeroespaciais. Em computação gráfica moderna, shaders que ignoram o cancelamento catastrófico sofrem de z-fighting e saltos descontínuos de cor.',
        geometric_intuition: 'Imagine desenhar em uma régua onde as marcas ficam exponencialmente mais espaçadas conforme nos afastamos de zero. Perto de 1.0, o menor incremento representável é ~10^-7. Subtrair dois números próximos anula toda a mantissa e preenche o resultado com ruído aritmético.',
        mathematical_derivation_latex: [
          '\\text{Seja } a = 1.0000001 \\text{ e } b = 1.0000000 \\text{ em base decimal hipotética.}',
          'a - b = 0.0000001 = 1.0 \\times 10^{-7} \\quad \\text{(Apenas 1 dígito de precisão restante)}',
          '\\text{Solução de Horner: } P(x) = a_n x^n + \\dots + a_0 = (\\dots(a_n x + a_{n-1})x + \\dots) + a_0',
          '\\text{Comprovado por Wilkinson (1963): o erro acumulado em Horner é estritamente limitado por } 2n \\cdot u \\cdot \\tilde{P}(|x|)'
        ],
        graphics_engine_pipeline: 'Cada registradores de GPU aloca 32 bits (ou half-float FP16 em dispositivos mobile). Instruções escalares sofrem latência se os operandos precisarem de conversão ou normalização de denormais.',
        curated_references: {
          papers_and_books: [
            {
              title: 'What Every Computer Scientist Should Know About Floating-Point Arithmetic',
              author: 'David Goldberg',
              year: '1991',
              description: 'O tratado clássico seminal sobre o modelo de erro em ponto flutuante.',
              url: 'https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html'
            }
          ],
          videos_and_talks: [
            {
              title: 'Floating Point Numbers - Computerphile',
              channel_or_speaker: 'Tom Scott / Computerphile',
              key_takeaway: 'Por que números flutuantes não são exatos e como o erro se propaga.',
              search_query_or_url: 'https://www.youtube.com/watch?v=PZRI1IfStY0'
            }
          ],
          code_and_projects: [
            {
              name: 'GLSL Precision & Catastrophic Cancellation Demo',
              repository_or_shadertoy: 'https://www.shadertoy.com/view/4t23RR',
              what_to_analyze: 'Observe a degradação de anéis concêntricos quando x^2 + y^2 perde precisão a distâncias moderadas da origem.'
            }
          ]
        }
      },
      interactiveExercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Para estabilizar } f(x) = \\sqrt{x+1} - \\sqrt{x} \\text{ para } x \\gg 1, \\text{ reescreva multiplicando pelo conjugado: } f(x) = \\frac{1}{\\sqrt{x+1} + \\sqrt{x}}.',
        expected_variables: {
          conjugado: '1/(sqrt(x+1)+sqrt(x))'
        },
        diagnostic_traps: [
          {
            trap_id: 'subtracao_direta',
            condition: 'conjugado.includes("sqrt(x+1)-sqrt(x)")',
            feedback: 'Você manteve a subtração direta de duas raízes quase idênticas, perpetuando a perda catastrófica de mantissa.'
          }
        ]
      },
      targetScoreKnowledge: 90,
      targetScore3D: 3
    },
    {
      id: 't0_algebra_fma_sub2',
      moduleId: 't0_algebra_fma',
      order: 2,
      title: 'Transição Algébrico-Espacial: Fatoração de Horner em Curvas Paramétricas e Splines',
      depthType: 'transicao_espacial_medio_3d',
      threeDApplicabilityWeight: 0.60,
      mathFoundation: 'Curvas de Bézier e Splines em espaços euclidianos bidimensionais e tridimensionais são polinômios vetoriais: C(t) = sum(B_{i,n}(t) P_i). A regra de Horner decompõe esses vetores em cadeias de interpolações afins consecutivas.',
      graphicApplication: 'Mapeamento de deformação de vértices e suavização de malhas em tesselação de superfícies cúbicas antes do fragment shader.',
      latexFormulas: [
        'C(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3',
        '\\text{Horner: } C(t) = P_0 + t \\left( 3(P_1 - P_0) + t \\left( 3(P_0 - 2P_1 + P_2) + t(-P_0 + 3P_1 - 3P_2 + P_3) \\right) \\right)',
        '\\mathbf{v}_{interp} = \\text{lerp}(\\text{lerp}(P_0, P_1, t), \\text{lerp}(P_1, P_2, t), t) \\quad \\text{(De Casteljau)}'
      ],
      didacticArticle: {
        title: 'Da Álgebra Abstrata à Trajetória Espacial: Polinômios de Bernstein',
        subtitle: 'A ponte analítica entre a fatoração pura de Horner e as curvas fundamentais do 3D',
        read_time_minutes: 9,
        scientific_pedagogy_note: 'Teoria da Dupla Codificação: Combinar a expressão algébrica aninhada de Horner com a representação geométrica dos pontos de controle no plano.',
        historical_context: 'Pierre Bézier, engenheiro da Renault, e Paul de Casteljau, da Citroën, desenvolveram simultaneamente na década de 1960 métodos para usinagem de carrocerias que se tornaram a fundação de modeladores 3D como Blender e Maya.',
        geometric_intuition: 'Cada avaliação de um polinômio de 3º grau via Horner é como caminhar ao longo de uma haste flexível onde cada segmento é esticado e rotacionado em função do parâmetro escalar t em [0, 1].',
        mathematical_derivation_latex: [
          '\\text{Cúbica canônica: } B(t) = a t^3 + b t^2 + c t + d',
          '\\text{FMA encadeada: } B(t) = ((a \\cdot t + b) \\cdot t + c) \\cdot t + d',
          '\\text{Custo tradicional: } 6 \\text{ multiplicações} + 3 \\text{ somas}',
          '\\text{Custo com Horner: } 3 \\text{ FMAs (3 ciclos de clock de ALU)}'
        ],
        graphics_engine_pipeline: 'Os processadores de geometria da GPU (Vertex Shaders e Tessellation Evaluation) avaliam milhares de curvas em paralelo utilizando exatamente esse encadeamento de FMA.',
        curated_references: {
          papers_and_books: [
            {
              title: 'Curves and Surfaces for CAGD: A Practical Guide',
              author: 'Gerald Farin',
              year: '2002',
              description: 'A bíblia definitiva sobre a formulação matemática de curvas de Bézier e B-Splines.'
            }
          ],
          videos_and_talks: [
            {
              title: 'The Continuity of Splines',
              channel_or_speaker: 'Freya Holmér',
              key_takeaway: 'Intuição geométrica visual insubstituível sobre como derivadas e interpolações constroem o espaço.',
              search_query_or_url: 'https://www.youtube.com/watch?v=jvPPXbo87ds'
            }
          ],
          code_and_projects: [
            {
              name: 'Bézier Curve GPU Evaluator in Shadertoy',
              repository_or_shadertoy: 'https://www.shadertoy.com/view/XsX3zf',
              what_to_analyze: 'Disseque o cálculo analítico da distância exata de um pixel até uma spline cúbica.'
            }
          ]
        }
      },
      interactiveExercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Quantas operações FMA } (a \\cdot b + c) \\text{ são necessárias para avaliar um polinômio cúbico } at^3 + bt^2 + ct + d \\text{ via Horner?}',
        expected_variables: {
          fma_count: '3'
        },
        diagnostic_traps: [
          {
            trap_id: 'custo_ingenuo',
            condition: 'fma_count == "6"',
            feedback: '6 é o custo com potências explícitas separadas; a fatoração de Horner reduz para exatamente 3 FMAs encadeadas.'
          }
        ]
      },
      targetScoreKnowledge: 90,
      targetScore3D: 6
    },
    {
      id: 't0_algebra_fma_sub3',
      moduleId: 't0_algebra_fma',
      order: 3,
      title: 'Microarquitetura de GPU: Instruções FMA/MAD e Otimização Extrema em Fragment Shaders',
      depthType: 'shaders_avancados_alto_3d',
      threeDApplicabilityWeight: 1.00,
      mathFoundation: 'Uma instrução Fused Multiply-Add realiza a operação round(a * b + c) com um único arredondamento ao final, preservando precisão e dobrando o throughput de FLOPS da ALU da placa de vídeo.',
      graphicApplication: 'Avaliação em tempo real de funções de transferência de iluminação, Smoothstep cúbico e quintico, e anti-aliasing analítico por pixel.',
      latexFormulas: [
        '\\text{smoothstep}(e_0, e_1, x): \\quad t = \\text{clamp}\\left(\\frac{x - e_0}{e_1 - e_0}, 0, 1\\right), \\quad S_1(t) = t^2(3 - 2t)',
        'S_2(t) = t^3(t(6t - 15) + 10) \\quad \\text{(Polinômio de Ken Perlin com } C^2 \\text{ continuidade)}',
        '\\text{Throughput} = 2 \\times \\text{Cores} \\times \\text{Clock} \\quad \\text{(Fator 2 devido à FMA)}'
      ],
      didacticArticle: {
        title: 'Microarquitetura de Silício: A Anatomia da Instrução FMA nas GPUs Modernas',
        subtitle: 'Do circuito aritmético combinatório ao render de 60 FPS com precisão milimétrica',
        read_time_minutes: 10,
        scientific_pedagogy_note: 'Ancoragem Física e Carga Germana: Conectar o código GLSL diretamente à contagem de transistores e ciclos de execução das Streaming Multiprocessors (SMs da NVIDIA / CUs da AMD).',
        historical_context: 'Até a arquitetura Fermi da NVIDIA (2010), placas gráficas executavam Multiply-Add com arredondamentos intermediários (MAD truncado). A adoção da norma IEEE 754-2008 estabeleceu a FMA com arredondamento único, revolucionando a renderização científica.',
        geometric_intuition: 'Em termos de hardware, pense na FMA como uma esteira mecânica contínua: os multiplicadores e o somador são alimentados no mesmo estágio de pipeline sem que a mantissa intermediária de 48 bits precise ser truncada antes da soma com o acumulador.',
        mathematical_derivation_latex: [
          '\\text{Multiplicação IEEE-754: } 24 \\text{ bits} \\times 24 \\text{ bits} = 48 \\text{ bits de produto}',
          '\\text{MAD clássico: Trunca para } 24 \\text{ bits, soma } c \\text{ e arredonda novamente (duplo erro)}',
          '\\text{FMA nativa: Mantém os } 48 \\text{ bits, alinha o expoente com } c, \\text{ soma e realiza } 1 \\text{ único arredondamento}',
          '\\text{Resultado: Erro estritamente menor que } 0.5 \\text{ ULP (Unit in the Last Place)}'
        ],
        graphics_engine_pipeline: 'Nas ALUs vetoriais (SIMD), compiladores HLSL (DXC) e GLSL (glslang) fundem automaticamente expressões do tipo x * y + z em instruções nativas v_fma_f32 ou FFMA.',
        curated_references: {
          papers_and_books: [
            {
              title: 'GPU Pro 7: Advanced Rendering Techniques',
              author: 'Wolfgang Engel',
              year: '2016',
              description: 'Otimização a nível de montagem e perfilamento de ALUs para motores de ponta.'
            }
          ],
          videos_and_talks: [
            {
              title: 'Understanding GPU Architecture & Shader Compilation',
              channel_or_speaker: 'NVIDIA Developer Channel',
              key_takeaway: 'Como as warps escalonam instruções aritméticas e evitam stalls de registradores.',
              search_query_or_url: 'https://developer.nvidia.com'
            }
          ],
          code_and_projects: [
            {
              name: 'Shadertoy Fast Polynomial Color Curves via FMA',
              repository_or_shadertoy: 'https://www.shadertoy.com/view/MdX3zr',
              what_to_analyze: 'Observe como curvas de tone mapping são avaliadas em 2 ciclos com FMA encadeado.'
            }
          ]
        }
      },
      interactiveExercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Qual a forma canônica de Horner para o polinômio quintico de Perlin } 6t^5 - 15t^4 + 10t^3 \\text{ otimizada para instruções FMA?}',
        expected_variables: {
          perlin_fma: 't*t*t*(t*(6*t-15)+10)'
        },
        diagnostic_traps: [
          {
            trap_id: 'perlin_nao_fatorado',
            condition: 'perlin_fma.includes("6*t*t*t*t*t")',
            feedback: 'Multiplicação de potências repetidas satura o agendador de registradores da GPU; agrupe t^3 e aninhe (6t - 15).'
          }
        ]
      },
      defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

// Ken Perlin Quintic Smootherstep via Horner FMA
float quinticSmooth(float t) {
    t = clamp(t, 0.0, 1.0);
    return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
}

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float t = uv.x * 0.5 + 0.5;
    float y = quinticSmooth(t) * 1.6 - 0.8;
    float dist = abs(uv.y - y);
    float intensity = smoothstep(0.015, 0.0, dist);
    fragColor = vec4(vec3(0.0, 0.94, 1.0) * intensity, 1.0);
}`,
      targetScoreKnowledge: 90,
      targetScore3D: 10
    }
  ],

  t1_vectors_dot: [
    {
      id: 't1_vectors_dot_sub1',
      moduleId: 't1_vectors_dot',
      order: 1,
      title: 'Espaços Métricos, Desigualdade de Cauchy-Schwarz e Normalização Euclidiana',
      depthType: 'base_formal_baixo_3d',
      threeDApplicabilityWeight: 0.25,
      mathFoundation: 'O produto interno canônico em R^n define a norma euclidiana ||v|| = sqrt(sum(v_i^2)). Pela Desigualdade de Cauchy-Schwarz, |<u, v>| <= ||u|| * ||v||, garantindo que o cosseno do ângulo theta = <u, v> / (||u|| ||v||) pertença estritamente ao intervalo [-1, 1].',
      graphicApplication: 'Fundamento analítico de qualquer cálculo de intensidade de luz, coerência geométrica e evitação de números complexos em raízes quadradas de shaders.',
      latexFormulas: [
        '|\\langle \\mathbf{u}, \\mathbf{v} \\rangle|^2 \\le \\langle \\mathbf{u}, \\mathbf{u} \\rangle \\cdot \\langle \\mathbf{v}, \\mathbf{v} \\rangle \\quad \\text{(Desigualdade de Cauchy-Schwarz)}',
        '\\cos\\theta = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\|\\mathbf{u}\\| \\|\\mathbf{v}\\|} \\in [-1, 1]',
        '\\text{norm}(\\mathbf{v}) = \\mathbf{v} \\cdot (\\mathbf{v} \\cdot \\mathbf{v})^{-1/2} \\quad \\text{(Fast Inverse Square Root)}'
      ],
      didacticArticle: {
        title: 'Espaços com Produto Interno e a Geometria das Normas',
        subtitle: 'A base matemática abstrata indispensável para medir ângulos e distâncias',
        read_time_minutes: 8,
        scientific_pedagogy_note: 'Rigor Axiomático: O produto interno não é apenas "uma fórmula de multiplicar coordenadas", mas sim uma forma bilinear simétrica positiva definida. Essa clareza evita erros comuns de cálculo com métricas não-euclidianas.',
        historical_context: 'Augustin-Louis Cauchy (1821) e Hermann Schwarz (1888) formularam a desigualdade que permitiu aos matemáticos tratar funções contínuas e vetores sob a mesma estrutura geométrica rigorosa.',
        geometric_intuition: 'A projeção de um vetor sobre o outro é a sombra ortogonal que um projeta sobre a reta gerada pelo segundo. Se os vetores são unitários, essa sombra tem exatamente o comprimento do cosseno.',
        mathematical_derivation_latex: [
          '\\text{Seja o polinômio quadrático em } t: P(t) = \\|\\mathbf{u} + t\\mathbf{v}\\|^2 \\ge 0 \\quad \\forall t \\in \\mathbb{R}',
          'P(t) = \\|\\mathbf{u}\\|^2 + 2t(\\mathbf{u} \\cdot \\mathbf{v}) + t^2 \\|\\mathbf{v}\\|^2 \\ge 0',
          '\\text{Para que } P(t) \\ge 0, \\text{ o discriminante } \\Delta \\le 0:',
          '\\Delta = 4(\\mathbf{u} \\cdot \\mathbf{v})^2 - 4\\|\\mathbf{u}\\|^2\\|\\mathbf{v}\\|^2 \\le 0 \\implies |\\mathbf{u} \\cdot \\mathbf{v}| \\le \\|\\mathbf{u}\\| \\|\\mathbf{v}\\|'
        ],
        graphics_engine_pipeline: 'Calculado via instruções de produto vetorial e inverso de raiz quadrada na GPU (DP3 / DP4 e RSQ).',
        curated_references: {
          papers_and_books: [
            {
              title: 'Linear Algebra Done Right, 4th Edition',
              author: 'Sheldon Axler',
              year: '2023',
              description: 'Capítulo 6: Inner Product Spaces — O tratamento moderno mais elegante do produto escalar.'
            }
          ],
          videos_and_talks: [
            {
              title: 'Dot products and duality | Chapter 9, Essence of linear algebra',
              channel_or_speaker: '3Blue1Brown',
              key_takeaway: 'Por que o produto interno é a transformação linear de projeção sobre a reta.',
              search_query_or_url: 'https://www.youtube.com/watch?v=LyGKycYT2v0'
            }
          ],
          code_and_projects: [
            {
              name: 'Fast Inverse Square Root Analysis',
              repository_or_shadertoy: 'https://en.wikipedia.org/wiki/Fast_inverse_square_root',
              what_to_analyze: 'O algoritmo 0x5f3759df do Quake III para normalização rápida de vetores.'
            }
          ]
        }
      },
      interactiveExercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Calcule o cosseno do ângulo entre os vetores } \\mathbf{u} = (3, 4) \\text{ e } \\mathbf{v} = (1, 0).',
        expected_variables: {
          cos_theta: '0.6'
        },
        diagnostic_traps: [
          {
            trap_id: 'esquecimento_da_norma',
            condition: 'cos_theta == "3"',
            feedback: 'Você calculou apenas o produto das coordenadas sem dividir pela norma ||u|| = sqrt(3^2 + 4^2) = 5.'
          }
        ]
      },
      targetScoreKnowledge: 90,
      targetScore3D: 3
    },
    {
      id: 't1_vectors_dot_sub2',
      moduleId: 't1_vectors_dot',
      order: 2,
      title: 'Transição Espacial: Projeção Ortogonal de Gram-Schmidt e Decomposição de Forças',
      depthType: 'transicao_espacial_medio_3d',
      threeDApplicabilityWeight: 0.60,
      mathFoundation: 'Dado um vetor v e um vetor normal n unitário, v pode ser decomposto unicamente em componentes paralela e perpendicular: v = v_paralelo + v_perpendicular, onde v_paralelo = (v . n) n e v_perpendicular = v - (v . n) n.',
      graphicApplication: 'Construção de planos tangentes, reflexão pura de raios ópticos (R = I - 2(I . N) N) e projeção de sombras em superfícies planas.',
      latexFormulas: [
        '\\mathbf{v}_{\\parallel} = (\\mathbf{v} \\cdot \\hat{\\mathbf{n}}) \\hat{\\mathbf{n}}, \\quad \\mathbf{v}_{\\perp} = \\mathbf{v} - (\\mathbf{v} \\cdot \\hat{\\mathbf{n}}) \\hat{\\mathbf{n}}',
        '\\mathbf{R} = \\mathbf{I} - 2(\\mathbf{I} \\cdot \\hat{\\mathbf{N}}) \\hat{\\mathbf{N}} \\quad \\text{(Fórmula de Reflexão Especular)}',
        '\\mathbf{u}_k = \\mathbf{v}_k - \\sum_{j=1}^{k-1} \\text{proj}_{\\mathbf{u}_j}(\\mathbf{v}_k) \\quad \\text{(Processo de Gram-Schmidt)}'
      ],
      didacticArticle: {
        title: 'Ortogonalidade no Espaço 3D e a Álgebra das Reflexões',
        subtitle: 'Decompondo vetores no espaço tridimensional para traçar a luz',
        read_time_minutes: 8,
        scientific_pedagogy_note: 'Ancoragem Espacial: A dedução da reflexão óptica depende exclusivamente da projeção ortogonal. Não decore a fórmula; deduza-a visualmente invertendo a componente perpendicular.',
        historical_context: 'Jørgen Pedersen Gram e Erhard Schmidt formalizaram o algoritmo de ortogonalização que hoje é implementado nos vertex shaders para gerar sistemas de coordenadas tangentes TBN sem distorção.',
        geometric_intuition: 'Pense em bater uma bola de tênis contra uma parede inclinada: a velocidade paralela à parede se mantém intacta; a velocidade perpendicular é invertida em sinal.',
        mathematical_derivation_latex: [
          '\\text{Seja o raio incidente } \\mathbf{I} \\text{ e a normal unitária da superfície } \\mathbf{N}.',
          '\\mathbf{I} = \\mathbf{I}_{\\parallel} + \\mathbf{I}_{\\perp}, \\quad \\text{onde } \\mathbf{I}_{\\perp} = (\\mathbf{I} \\cdot \\mathbf{N})\\mathbf{N}',
          '\\text{O raio refletido } \\mathbf{R} \\text{ preserva a componente tangencial e inverte a normal:}',
          '\\mathbf{R} = \\mathbf{I}_{\\parallel} - \\mathbf{I}_{\\perp} = (\\mathbf{I} - \\mathbf{I}_{\\perp}) - \\mathbf{I}_{\\perp} = \\mathbf{I} - 2\\mathbf{I}_{\\perp} = \\mathbf{I} - 2(\\mathbf{I} \\cdot \\mathbf{N})\\mathbf{N}'
        ],
        graphics_engine_pipeline: 'Implementado nativamente em GLSL/HLSL através da função intrínseca reflect(I, N).',
        curated_references: {
          papers_and_books: [
            {
              title: 'Essential Mathematics for Games and Interactive Applications',
              author: 'James M. Van Verth, Lars M. Bishop',
              year: '2014',
              description: 'Capítulo 4: Vector Operations — Decomposição de Gram-Schmidt e matrizes de projeção.'
            }
          ],
          videos_and_talks: [
            {
              title: 'Gram-Schmidt Process in 3D',
              channel_or_speaker: 'Khan Academy',
              key_takeaway: 'Como converter 3 vetores arbitrários em uma base ortonormal perfeita.',
              search_query_or_url: 'https://www.khanacademy.org'
            }
          ],
          code_and_projects: [
            {
              name: 'GLSL reflect() & refract() Visualizer',
              repository_or_shadertoy: 'https://www.shadertoy.com/view/4tl3z7',
              what_to_analyze: 'Inspeção geométrica dos vetores incidentes, normais e refletidos em tempo real.'
            }
          ]
        }
      },
      interactiveExercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Dado } \\mathbf{I} = (0, -1, 0) \\text{ e } \\mathbf{N} = (0, 1, 0), \\text{ calcule o vetor refletido } \\mathbf{R} = \\mathbf{I} - 2(\\mathbf{I} \\cdot \\mathbf{N})\\mathbf{N}.',
        expected_variables: {
          R_y: '1.0'
        },
        diagnostic_traps: [
          {
            trap_id: 'sinal_invertido',
            condition: 'R_y == "-1.0"',
            feedback: 'A componente perpendicular à superfície deve inverter de sinal; o raio que desce (-1) deve subir (+1).'
          }
        ]
      },
      targetScoreKnowledge: 90,
      targetScore3D: 6
    },
    {
      id: 't1_vectors_dot_sub3',
      moduleId: 't1_vectors_dot',
      order: 3,
      title: 'Computação Gráfica: Lei do Cosseno de Lambert e Shading Difuso em Fragment Shaders',
      depthType: 'shaders_avancados_alto_3d',
      threeDApplicabilityWeight: 1.00,
      mathFoundation: 'A irradiância recebida por uma superfície difusa é proporcional à densidade de fluxo de fótons incidente: E = E_0 * max(0, N . L). Esse modelo de reflexão idealmente difusa (Lambertiana) estabelece que a luminância refletida é constante em todas as direções de observação.',
      graphicApplication: 'O núcleo de toda renderização física de superfícies opacas em tempo real, luzes pontuais, direcionais e mapeamento de normais.',
      latexFormulas: [
        'I_{\\text{diffuse}} = k_d \\cdot I_L \\cdot \\max(0, \\hat{\\mathbf{N}} \\cdot \\hat{\\mathbf{L}})',
        '\\text{clamp}(\\mathbf{N} \\cdot \\mathbf{L}, 0.0, 1.0) \\equiv \\text{saturate}(\\mathbf{N} \\cdot \\mathbf{L})',
        'L_o(p, \\omega_o) = \\int_{\\Omega} f_r(p, \\omega_i, \\omega_o) L_i(p, \\omega_i) (\\mathbf{n} \\cdot \\omega_i) d\\omega_i'
      ],
      didacticArticle: {
        title: 'A Lei do Cosseno de Lambert e a Física dos Fótons na GPU',
        subtitle: 'Como o produto interno da geometria determina o brilho perceptual de cada pixel 3D',
        read_time_minutes: 10,
        scientific_pedagogy_note: 'Conexão Fotométrica: Explicar por que a área aparente de um feixe de luz aumenta com o ângulo (1/cos theta), espalhando a energia sobre uma área maior e diminuindo a intensidade por unidade de área.',
        historical_context: 'Johann Heinrich Lambert publicou em 1760 a obra Photometria, deduzindo a lei empírica que é a espinha dorsal de todo pipeline gráfico desde os primórdios do Gouraud e Phong Shading até o PBR moderno.',
        geometric_intuition: 'Se você segurar uma lanterna perpendicular a uma parede, o círculo de luz é concentrado e brilhante. Conforme você inclina a lanterna, a luz se estica em uma elipse maior e o brilho decai exatamente pelo cosseno do ângulo.',
        mathematical_derivation_latex: [
          '\\text{Fluxo de energia } \\Phi = \\text{constante}',
          '\\text{Área iluminada na superfície: } A_{\\text{superfície}} = \\frac{A_{\\text{feixe}}}{\\cos\\theta}',
          '\\text{Irradiância } E = \\frac{\\Phi}{A_{\\text{superfície}}} = \\frac{\\Phi}{A_{\\text{feixe}}} \\cos\\theta = E_0 \\cos\\theta = E_0 (\\mathbf{N} \\cdot \\mathbf{L})',
          '\\text{Condição de visibilidade: Superfícies viradas para longe da luz (}\\mathbf{N} \\cdot \\mathbf{L} < 0\\text{) recebem 0 irradiância: } \\max(0, \\mathbf{N} \\cdot \\mathbf{L})'
        ],
        graphics_engine_pipeline: 'Executado por pixel em milhares de núcleos de shaders da GPU simultaneamente, recebendo a normal interpolada dos vértices ou amostrada de um Normal Map.',
        curated_references: {
          papers_and_books: [
            {
              title: 'Physically Based Rendering: From Theory to Implementation',
              author: 'Matt Pharr, Wenzel Jakob, Greg Humphreys',
              year: '2023',
              description: 'Capítulo 5: Color and Radiometry — A física exata da irradiância e reflexão difusa.'
            }
          ],
          videos_and_talks: [
            {
              title: 'How Shaders Work - The Math of Light',
              channel_or_speaker: 'The Art of Code',
              key_takeaway: 'Implementação prática passo a passo do modelo de iluminação difusa em GLSL.',
              search_query_or_url: 'https://www.youtube.com/@TheArtofCodeIsCool'
            }
          ],
          code_and_projects: [
            {
              name: 'Shadertoy Pure Lambertian Diffuse Sphere',
              repository_or_shadertoy: 'https://www.shadertoy.com/view/4djSRW',
              what_to_analyze: 'Cálculo de normal analítica de esfera e produto N . L sem bibliotecas externas.'
            }
          ]
        }
      },
      interactiveExercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Calcule a intensidade difusa } I = \\max(0, \\mathbf{N} \\cdot \\mathbf{L}) \\text{ para } \\mathbf{N} = (0, 0.6, 0.8) \\text{ e } \\mathbf{L} = (0, 0, 1).',
        expected_variables: {
          I_diffuse: '0.8'
        },
        diagnostic_traps: [
          {
            trap_id: 'projecao_y',
            condition: 'I_diffuse == "0.6"',
            feedback: 'A luz aponta no eixo Z (0, 0, 1); portanto a projeção é N_z = 0.8, não N_y.'
          }
        ]
      },
      defaultGlslShader: `precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 fragColor;

void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    // Ray-sphere intersection
    float r2 = dot(uv, uv);
    if (r2 > 0.64) {
        fragColor = vec4(0.04, 0.05, 0.08, 1.0);
        return;
    }
    float z = sqrt(0.64 - r2);
    vec3 normal = normalize(vec3(uv, z));
    // Moving light
    vec3 lightPos = normalize(vec3(sin(u_time * 1.5) * 1.5, cos(u_time * 1.5) * 1.2, 1.0));
    float diff = max(0.0, dot(normal, lightPos));
    vec3 col = vec3(0.0, 0.94, 1.0) * diff + vec3(0.02, 0.04, 0.06);
    fragColor = vec4(col, 1.0);
}`,
      targetScoreKnowledge: 90,
      targetScore3D: 10
    }
  ]
};

/**
 * Retorna os submódulos de um nó, fornecendo progressão gradual de 3D caso não existam no mapa estático.
 */
export function getSubModulesForNode(nodeId: string, nodeTitle?: string): SubModule[] {
  if (INITIAL_SUBMODULES[nodeId]) {
    return INITIAL_SUBMODULES[nodeId];
  }

  const title = nodeTitle || 'Tópico Matemático';

  return [
    {
      id: `${nodeId}_sub1`,
      moduleId: nodeId,
      order: 1,
      title: `Base Formal Rigorosa: Análise e Mecânica Analítica de ${title}`,
      depthType: 'base_formal_baixo_3d',
      threeDApplicabilityWeight: 0.25,
      mathFoundation: `Definições formais, axiomas, estabilidade numérica e deduções analíticas fundamentais de ${title}.`,
      graphicApplication: `Mapeamento escalar e limitações aritméticas na precisão de registradores da GPU.`,
      latexFormulas: [
        'f(\\mathbf{x}) = \\sum_{i=1}^n c_i \\phi_i(\\mathbf{x}), \\quad \\|\\mathbf{e}\\| \\le \\mathcal{O}(\\epsilon)',
        '\\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h} = f\'(x)'
      ],
      targetScoreKnowledge: 90,
      targetScore3D: 3
    },
    {
      id: `${nodeId}_sub2`,
      moduleId: nodeId,
      order: 2,
      title: `Transição Espacial & Vetorial: Geometria e Projeções de ${title}`,
      depthType: 'transicao_espacial_medio_3d',
      threeDApplicabilityWeight: 0.60,
      mathFoundation: `Espaços vetoriais euclidianos, operadores diferenciais e transformações de coordenadas associadas a ${title}.`,
      graphicApplication: `Transformação de vértices, cálculo de normais tangentes e projeções ortogonais de câmera.`,
      latexFormulas: [
        '\\nabla f = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z} \\right)',
        '\\mathbf{x}\' = \\mathbf{M}_{4\\times 4} \\cdot \\mathbf{x}'
      ],
      targetScoreKnowledge: 90,
      targetScore3D: 6
    },
    {
      id: `${nodeId}_sub3`,
      moduleId: nodeId,
      order: 3,
      title: `Shaders Avançados & Pipeline GPU: Implementação em Tempo Real de ${title}`,
      depthType: 'shaders_avancados_alto_3d',
      threeDApplicabilityWeight: 1.00,
      mathFoundation: `Modelagem física completa, integração numérica e microarquitetura de execução em massa paralela de ${title}.`,
      graphicApplication: `Fragment shaders GLSL/HLSL, Ray Marching, BRDF física e iluminação global de alta performance.`,
      latexFormulas: [
        'L_o = L_e + \\int_{\\Omega} f_r L_i (\\mathbf{n} \\cdot \\omega_i) d\\omega_i',
        '\\mathbf{N} = \\text{normalize}(\\nabla \\text{SDF}(\\mathbf{p}))'
      ],
      targetScoreKnowledge: 90,
      targetScore3D: 10
    }
  ];
}
