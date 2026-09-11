import { DiagnosticTrap } from '@/types/ai-contract';

export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  score3D: number;
  matchedTrap?: DiagnosticTrap;
  feedbackMessage: string;
}

export function evaluateSubmission(
  expectedVariables: Record<string, string>,
  diagnosticTraps: DiagnosticTrap[],
  userAnswers: Record<string, string>
): EvaluationResult {
  // Check diagnostic traps first
  for (const trap of diagnosticTraps) {
    const isTrapTriggered = checkTrapCondition(trap.condition, userAnswers);
    if (isTrapTriggered) {
      return {
        isCorrect: false,
        score: 40,
        score3D: 2,
        matchedTrap: trap,
        feedbackMessage: `[DIAGNÓSTICO CIRÚRGICO]: ${trap.feedback}`,
      };
    }
  }

  // Check expected variables
  const keys = Object.keys(expectedVariables);
  let correctCount = 0;

  for (const key of keys) {
    const expected = expectedVariables[key].trim().toLowerCase();
    const provided = (userAnswers[key] || '').trim().toLowerCase();

    if (!provided) continue;

    // Number comparison with tolerance
    const numExpected = parseFloat(expected);
    const numProvided = parseFloat(provided);

    if (!isNaN(numExpected) && !isNaN(numProvided)) {
      const diff = Math.abs(numExpected - numProvided);
      const tolerance = Math.max(0.02, Math.abs(numExpected) * 0.05);
      if (diff <= tolerance) {
        correctCount++;
      }
    } else {
      // String / formula comparison (ignoring spaces)
      const cleanExp = expected.replace(/\s+/g, '');
      const cleanProv = provided.replace(/\s+/g, '');
      if (cleanExp === cleanProv) {
        correctCount++;
      }
    }
  }

  const ratio = keys.length > 0 ? correctCount / keys.length : 0;
  const isCorrect = ratio === 1.0;
  const score = Math.round(ratio * 90);
  const score3D = Math.round(ratio * 10);

  return {
    isCorrect,
    score,
    score3D,
    feedbackMessage: isCorrect
      ? `Avaliação aprovada com sucesso! Pontuação obtida: ${score}/90 — Desempenho Gráfico: ${score3D}/10.`
      : `Incorreto. Você acertou ${correctCount} de ${keys.length} variáveis requeridas.`,
  };
}

/**
 * Avaliador seguro de condições de armadilhas sem eval arbitrário
 */
function checkTrapCondition(condition: string, userAnswers: Record<string, string>): boolean {
  try {
    const orParts = condition.split('||').map((p) => p.trim());
    for (const part of orParts) {
      const match = part.match(/([a-zA-Z0-9_]+)\s*(==|!=|>|<)\s*([a-zA-Z0-9_.-]+)/);
      if (match) {
        const [, varName, op, targetVal] = match;
        const userVal = (userAnswers[varName] || '').trim();
        if (!userVal) continue;

        const numUser = parseFloat(userVal);
        const numTarget = parseFloat(targetVal);

        if (!isNaN(numUser) && !isNaN(numTarget)) {
          if (op === '==' && Math.abs(numUser - numTarget) < 0.01) return true;
          if (op === '!=' && Math.abs(numUser - numTarget) >= 0.01) return true;
          if (op === '>' && numUser > numTarget) return true;
          if (op === '<' && numUser < numTarget) return true;
        } else {
          if (op === '==' && userVal === targetVal) return true;
          if (op === '!=' && userVal !== targetVal) return true;
        }
      }
    }
  } catch (err) {
    console.error('Error evaluating trap condition:', err);
  }
  return false;
}
