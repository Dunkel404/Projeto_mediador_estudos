import { create } from 'zustand';
import { db, AttemptLog } from './db';
import { CURRICULUM_NODES } from '@/core/curriculum/nodes';
import { CurriculumNode, UserNodeProgress, ProficiencyLevel, ResponseSpeed } from '@/types/curriculum';
import { FSRSCard } from '@/types/fsrs';
import { fsrs } from '@/core/fsrs/fsrs';

interface AppStore {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  fsrsMap: Record<string, FSRSCard>;
  activeNodeId: string | null;
  isLoading: boolean;
  apiKey: string;

  // Actions
  initializeData: () => Promise<void>;
  setActiveNodeId: (id: string | null) => void;
  setApiKey: (key: string) => Promise<void>;
  recordExerciseAttempt: (params: {
    nodeId: string;
    scoreKnowledge: number;
    score3D: number;
    timeSpentSeconds: number;
    timeLimitSeconds: number;
    userAnswer: string;
    isCorrect: boolean;
    diagnosticLogged?: string;
  }) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  nodes: CURRICULUM_NODES,
  progressMap: {},
  fsrsMap: {},
  activeNodeId: null,
  isLoading: true,
  apiKey: '',

  initializeData: async () => {
    try {
      // Load nodes from DB
      const dbProgress = await db.userNodes.toArray();
      const dbCards = await db.fsrsCards.toArray();
      const apiKeySetting = await db.settings.get('gemini_api_key');

      const progressMap: Record<string, UserNodeProgress> = {};
      const fsrsMap: Record<string, FSRSCard> = {};

      for (const p of dbProgress) progressMap[p.nodeId] = p;
      for (const c of dbCards) fsrsMap[c.nodeId] = c;

      // Check if nodes are seeded in DB; if not, initialize root nodes as 'available'
      for (const node of CURRICULUM_NODES) {
        if (!progressMap[node.id]) {
          const isInitialAvailable = node.prerequisites.length === 0;
          const initialProgress: UserNodeProgress = {
            nodeId: node.id,
            status: isInitialAvailable ? 'available' : 'locked',
            scoreKnowledge: 0,
            score3D: 0,
            proficiencyLevel: 'Inicial',
            responseSpeed: 'Moderada',
            attentionPoints: [],
            totalAttempts: 0,
            correctAttempts: 0,
          };
          const initialCard = fsrs.createInitialCard(node.id);

          await db.userNodes.put(initialProgress);
          await db.fsrsCards.put(initialCard);

          progressMap[node.id] = initialProgress;
          fsrsMap[node.id] = initialCard;
        } else {
          // Check for memory decay via FSRS retrievability
          const card = fsrsMap[node.id];
          if (card && card.state !== 0 && progressMap[node.id].status === 'mastered') {
            const retrievability = fsrs.getRetrievability(card);
            if (retrievability < 0.7) {
              progressMap[node.id].status = 'critical_decay';
              await db.userNodes.update(node.id, { status: 'critical_decay' });
            }
          }
        }
      }

      set({
        progressMap,
        fsrsMap,
        apiKey: apiKeySetting ? apiKeySetting.value : '',
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to initialize database:', err);
      set({ isLoading: false });
    }
  },

  setActiveNodeId: (id) => set({ activeNodeId: id }),

  setApiKey: async (key: string) => {
    await db.settings.put({ key: 'gemini_api_key', value: key });
    set({ apiKey: key });
  },

  recordExerciseAttempt: async ({
    nodeId,
    scoreKnowledge,
    score3D,
    timeSpentSeconds,
    timeLimitSeconds,
    userAnswer,
    isCorrect,
    diagnosticLogged,
  }) => {
    const { progressMap, fsrsMap, nodes } = get();
    const currentProgress = progressMap[nodeId];
    const currentCard = fsrsMap[nodeId] || fsrs.createInitialCard(nodeId);

    if (!currentProgress) return;

    // FSRS Rating determinístico
    const rating = fsrs.scoreToRating(scoreKnowledge, timeSpentSeconds, timeLimitSeconds);
    const updatedCard = fsrs.repeat(currentCard, rating);

    // Mapeamento de proficiência
    let proficiencyLevel: ProficiencyLevel = 'Inicial';
    if (scoreKnowledge >= 88) proficiencyLevel = 'Altíssimo';
    else if (scoreKnowledge >= 70) proficiencyLevel = 'Alto';
    else if (scoreKnowledge >= 50) proficiencyLevel = 'Moderado';

    // Mapeamento de velocidade
    let responseSpeed: ResponseSpeed = 'Moderada';
    if (timeSpentSeconds <= timeLimitSeconds * 0.5) responseSpeed = 'Altíssima';
    else if (timeSpentSeconds <= timeLimitSeconds * 0.8) responseSpeed = 'Alta';
    else if (timeSpentSeconds > timeLimitSeconds * 1.3) responseSpeed = 'Lenta';

    // Diagnósticos de atenção
    const attentionPoints = [...currentProgress.attentionPoints];
    if (diagnosticLogged && !attentionPoints.includes(diagnosticLogged)) {
      attentionPoints.push(diagnosticLogged);
    }
    // Remove fixed diagnostic if solved correctly with high score
    if (isCorrect && scoreKnowledge >= 80 && attentionPoints.length > 0) {
      attentionPoints.shift();
    }

    const isMastered = scoreKnowledge >= 90 && score3D >= 8;
    const nextStatus = isMastered ? 'mastered' : 'available';

    const updatedProgress: UserNodeProgress = {
      ...currentProgress,
      status: nextStatus,
      scoreKnowledge: Math.max(currentProgress.scoreKnowledge, scoreKnowledge),
      score3D: Math.max(currentProgress.score3D, score3D),
      proficiencyLevel,
      responseSpeed,
      attentionPoints,
      totalAttempts: currentProgress.totalAttempts + 1,
      correctAttempts: currentProgress.correctAttempts + (isCorrect ? 1 : 0),
      lastAttemptAt: new Date().toISOString(),
    };

    // Save attempt log
    const attempt: AttemptLog = {
      nodeId,
      timestamp: new Date().toISOString(),
      scoreKnowledge,
      score3D,
      timeSpentSeconds,
      userAnswer,
      isCorrect,
      diagnosticLogged,
    };

    await db.userNodes.put(updatedProgress);
    await db.fsrsCards.put(updatedCard);
    await db.attempts.add(attempt);

    const newProgressMap = { ...progressMap, [nodeId]: updatedProgress };
    const newFsrsMap = { ...fsrsMap, [nodeId]: updatedCard };

    // Check unlocking of dependent nodes
    for (const node of nodes) {
      if (newProgressMap[node.id]?.status === 'locked') {
        const allPrereqsMet = node.prerequisites.every((prereqId) => {
          const prereqProg = newProgressMap[prereqId];
          return prereqProg && (prereqProg.status === 'mastered' || prereqProg.scoreKnowledge >= 75);
        });
        if (allPrereqsMet) {
          const unlocked: UserNodeProgress = {
            ...newProgressMap[node.id],
            status: 'available',
          };
          await db.userNodes.put(unlocked);
          newProgressMap[node.id] = unlocked;
        }
      }
    }

    set({ progressMap: newProgressMap, fsrsMap: newFsrsMap });
  },
}));
