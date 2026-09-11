import { describe, it, expect } from 'vitest';
import { evaluateSubmission } from '../evaluator';
import { getOfflineAssessment } from '../offline-bank';
import { geminiEngine } from '../gemini-engine';

describe('Evaluator and Diagnostic Traps', () => {
  it('should detect correct answer within numerical tolerance', () => {
    const expected = { I: '0.969' };
    const traps = [
      {
        trap_id: 'forgot_normalization',
        condition: 'I == 63',
        feedback: 'Esqueceu de normalizar.',
      },
    ];

    const result = evaluateSubmission(expected, traps, { I: '0.97' });
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(90);
    expect(result.score3D).toBe(10);
  });

  it('should intercept diagnostic trap condition accurately', () => {
    const expected = { I: '0.969' };
    const traps = [
      {
        trap_id: 'forgot_normalization',
        condition: 'I == 63',
        feedback: 'Você omitiu a divisão pelas normas.',
      },
    ];

    const result = evaluateSubmission(expected, traps, { I: '63' });
    expect(result.isCorrect).toBe(false);
    expect(result.matchedTrap?.trap_id).toBe('forgot_normalization');
    expect(result.feedbackMessage).toContain('Você omitiu a divisão pelas normas');
    expect(result.score).toBe(40);
  });

  it('should retrieve offline fallback assessment properly for any node', () => {
    const nodeAssessment = getOfflineAssessment('t1_vectors_dot');
    expect(nodeAssessment.session_id).toBe('offline_t1_dot_01');
    expect(nodeAssessment.interactive_exercise.expected_variables.I).toBe('0.969');

    const unknownAssessment = getOfflineAssessment('unknown_node');
    expect(unknownAssessment.session_id).toBe('offline_proc_unknown_node');
    expect(unknownAssessment.interactive_exercise.expected_variables.V).toBe('1.0');
  });

  it('should sanitize and validate Gemini Web response wrapped in markdown', () => {
    const sampleValid = getOfflineAssessment('t1_vectors_dot');
    const wrappedInMarkdown = `Aqui está o JSON requisitado:\n\`\`\`json\n${JSON.stringify(
      sampleValid,
      null,
      2
    )}\n\`\`\`\nBons estudos!`;

    const result = geminiEngine.parseAndValidateGeminiResponse(wrappedInMarkdown);
    expect(result.success).toBe(true);
    expect(result.data?.session_id).toBe('offline_t1_dot_01');
    expect(result.data?.interactive_exercise.expected_variables.I).toBe('0.969');
  });

  it('should reject invalid or malformed JSON from Gemini', () => {
    const invalidText = 'Esta é uma resposta sem JSON válido.';
    const result = geminiEngine.parseAndValidateGeminiResponse(invalidText);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
