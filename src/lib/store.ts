import { create } from 'zustand';
import { db, AttemptLog } from './db';
import { CURRICULUM_NODES } from '@/core/curriculum/nodes';
import { CurriculumNode, UserNodeProgress, ProficiencyLevel, ResponseSpeed } from '@/types/curriculum';
import { FSRSCard } from '@/types/fsrs';
import { fsrs } from '@/core/fsrs/fsrs';
import { GoogleUserProfile } from './oauth';

interface AppStore {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  fsrsMap: Record<string, FSRSCard>;
  activeNodeId: string | null;
  isLoading: boolean;

  // OAuth 2.0 State
  oauthToken: string | null;
  oauthExpiresAt: number | null;
  oauthClientId: string;
  googleUser: GoogleUserProfile | null;

  // Actions
  initializeData: () => Promise<void>;
  setActiveNodeId: (id: string | null) => void;
  setOAuthClientId: (clientId: string) => Promise<void>;
  setOAuthSession: (params: {
    token: string;
    expiresIn: number;
    user?: GoogleUserProfile;
    clientId?: string;
  }) => Promise<void>;
  // Submodule & Dynamic Expansion Actions
  appendDynamicSubModule: (nodeId: string, subModule: any) => Promise<void>;
  setActiveSubModule: (nodeId: string, subModuleId: string) => Promise<void>;

  recordExerciseAttempt: (params: {
    nodeId: string;
    subModuleId?: string;
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

  oauthToken: null,
  oauthExpiresAt: null,
  oauthClientId: '',
  googleUser: null,

  initializeData: async () => {
    try {
      // Load nodes from DB
      const dbProgress = await db.userNodes.toArray();
      const dbCards = await db.fsrsCards.toArray();

      // Load OAuth settings from DB
      const storedToken = await db.settings.get('oauth_access_token');
      const storedExpiry = await db.settings.get('oauth_expires_at');
      const storedClientId = await db.settings.get('oauth_client_id');
      const storedUser = await db.settings.get('oauth_user_profile');

      let parsedUser: GoogleUserProfile | null = null;
      if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser.value);
        } catch {}
      }

      const tokenVal = storedToken ? storedToken.value : null;
      const expiryVal = storedExpiry ? parseInt(storedExpiry.value, 10) : null;
      const clientIdVal = storedClientId ? storedClientId.value : '';

      const progressMap: Record<string, UserNodeProgress> = {};
      const fsrsMap: Record<string, FSRSCard> = {};

      for (const p of dbProgress) progressMap[p.nodeId] = p;
      for (const c of dbCards) fsrsMap[c.nodeId] = c;

      // Seed initial nodes in DB if not present
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

      // Load dynamic submodules from DB and merge into nodes
      const dynamicSubs = await db.dynamicSubmodules.toArray();
      let currentNodes = CURRICULUM_NODES;
      if (dynamicSubs.length > 0) {
        currentNodes = CURRICULUM_NODES.map((n) => {
          const matching = dynamicSubs.filter((s) => s.moduleId === n.id);
          if (matching.length === 0) return n;
          const baseSubs = n.submodules || [];
          const combined = [...baseSubs];
          for (const sub of matching) {
            if (!combined.some((s) => s.id === sub.id)) {
              combined.push(sub);
            }
          }
          return { ...n, submodules: combined };
        });
      }

      set({
        nodes: currentNodes,
        progressMap,
        fsrsMap,
        oauthToken: tokenVal,
        oauthExpiresAt: expiryVal,
        oauthClientId: clientIdVal,
        googleUser: parsedUser,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to initialize database:', err);
      set({ isLoading: false });
    }
  },

  setActiveNodeId: (id) => set({ activeNodeId: id }),

  setOAuthClientId: async (clientId: string) => {
    await db.settings.put({ key: 'oauth_client_id', value: clientId });
    set({ oauthClientId: clientId });
  },

  setOAuthSession: async ({ token, expiresIn, user, clientId }) => {
    const expiresAt = Date.now() + expiresIn * 1000;

    await db.settings.put({ key: 'oauth_access_token', value: token });
    await db.settings.put({ key: 'oauth_expires_at', value: expiresAt.toString() });

    if (clientId) {
      await db.settings.put({ key: 'oauth_client_id', value: clientId });
    }

    if (user) {
      await db.settings.put({ key: 'oauth_user_profile', value: JSON.stringify(user) });
    }

    set({
      oauthToken: token,
      oauthExpiresAt: expiresAt,
      googleUser: user || null,
      ...(clientId ? { oauthClientId: clientId } : {}),
    });
  },

  clearOAuthSession: async () => {
    await db.settings.delete('oauth_access_token');
    await db.settings.delete('oauth_expires_at');
    await db.settings.delete('oauth_user_profile');

    set({
      oauthToken: null,
      oauthExpiresAt: null,
      googleUser: null,
    });
  },

  appendDynamicSubModule: async (nodeId: string, subModule: any) => {
    await db.dynamicSubmodules.put(subModule);
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === nodeId) {
          const existing = node.submodules || [];
          if (existing.some((s) => s.id === subModule.id)) return node;
          return {
            ...node,
            submodules: [...existing, subModule],
          };
        }
        return node;
      });
      return { nodes: updatedNodes };
    });
  },

  setActiveSubModule: async (nodeId: string, subModuleId: string) => {
    set((state) => {
      const progress = state.progressMap[nodeId];
      if (!progress) return state;
      const updatedProgress = { ...progress, activeSubModuleId: subModuleId };
      db.userNodes.update(nodeId, { activeSubModuleId: subModuleId });
      return {
        progressMap: {
          ...state.progressMap,
          [nodeId]: updatedProgress,
        },
      };
    });
  },

  recordExerciseAttempt: async ({
    nodeId,
    subModuleId,
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

    // Submodule progress tracking
    const subMap = currentProgress.submoduleProgressMap || {};
    if (subModuleId) {
      const existingSub = subMap[subModuleId];
      subMap[subModuleId] = {
        subModuleId,
        isCompleted: isCorrect && scoreKnowledge >= 85,
        scoreKnowledge: Math.max(existingSub?.scoreKnowledge || 0, scoreKnowledge),
        score3D: Math.max(existingSub?.score3D || 0, score3D),
        attempts: (existingSub?.attempts || 0) + 1,
      };
    }

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
      submoduleProgressMap: subMap,
    };

    // Save attempt log
    const attempt: AttemptLog = {
      nodeId,
      subModuleId,
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
