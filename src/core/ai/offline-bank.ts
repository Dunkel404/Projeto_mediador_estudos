import { LessonAndAssessmentResponse } from '@/types/ai-contract';

export const OFFLINE_STRESS_BANK: Record<string, LessonAndAssessmentResponse> = {
  t0_algebra_fma: {
    session_id: 'offline_t0_fma_01',
    topic: {
      title: 'Otimização de Polinômios e FMA em Fragment Shaders',
      math_foundation: 'Todo polinômio de grau n pode ser reescrito na forma aninhada de Horner: P(x) = (...((a_n x + a_{n-1})x + a_{n-2})...) + a_0, reduzindo multiplicações de O(n²) para O(n).',
      graphic_application: 'Hardware de GPU executa FMA (Fused Multiply-Add) em ciclo único, dobrando o throughput de cálculos de cor e interpolação de curvas.',
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
    // Implemente a avaliação FMA: ((4.0*x - 3.0)*x + 2.0)*x - 7.0
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

  // Fallback procedural assessment for any other node
  return {
    session_id: `offline_proc_${nodeId}`,
    topic: {
      title: `Avaliação de Estresse: ${nodeId}`,
      math_foundation: 'Fundamentos rigorosos de computação gráfica matemática aplicados a shaders.',
      graphic_application: 'Otimização e precisão visual em fragment shaders e pipelines 3D.',
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
