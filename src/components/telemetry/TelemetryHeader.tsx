'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { googleOAuth } from '@/lib/oauth';
import { Activity, Cpu, ShieldAlert, LogIn, LogOut, Check, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const TelemetryHeader: React.FC = () => {
  const {
    progressMap,
    oauthToken,
    oauthExpiresAt,
    oauthClientId,
    googleUser,
    setOAuthSession,
    clearOAuthSession,
    setOAuthClientId,
  } = useAppStore();

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [clientIdInput, setClientIdInput] = useState<string>(oauthClientId || '');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const totalNodes = Object.keys(progressMap).length || 18;
  const masteredCount = Object.values(progressMap).filter((p) => p.status === 'mastered').length;
  const decayCount = Object.values(progressMap).filter((p) => p.status === 'critical_decay').length;

  const scores = Object.values(progressMap).map((p) => p.scoreKnowledge);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const isTokenValid = oauthToken && (!oauthExpiresAt || Date.now() < oauthExpiresAt);

  const handleConnectGoogle = async () => {
    if (!clientIdInput.trim()) {
      setAuthError('Informe o Google OAuth Client ID para autenticar.');
      return;
    }

    setAuthError(null);
    setIsAuthenticating(true);

    try {
      await setOAuthClientId(clientIdInput.trim());
      const result = await googleOAuth.requestOAuthToken(clientIdInput.trim());

      await setOAuthSession({
        token: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
        clientId: clientIdInput.trim(),
      });

      setShowAuthModal(false);
    } catch (err: any) {
      console.error('OAuth error:', err);
      setAuthError(err.message || 'Falha ao autenticar com o Google OAuth.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    if (oauthToken) {
      await googleOAuth.revokeToken(oauthToken);
    }
    await clearOAuthSession();
    setShowAuthModal(false);
  };

  return (
    <header className="w-full bg-[#0a0b0e] border-b border-[#242933] px-4 py-2.5 flex items-center justify-between z-40">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
          <h1 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
            SHADER<span className="text-[#00f0ff]">MATH</span> // PROFILER
          </h1>
        </div>
        <span className="hidden md:inline text-[10px] font-mono px-2 py-0.5 bg-[#12141a] border border-[#242933] text-slate-400">
          VULKAN LOW-LEVEL PIPELINE
        </span>
      </div>

      {/* Real-time Telemetry Indicators */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden sm:flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-slate-400">CONHECIMENTO MÉDIO:</span>
          <span className="text-[#00f0ff] font-bold">{avgScore}/90</span>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#ffb000]" />
          <span className="text-slate-400 hidden sm:inline">DOMÍNIO:</span>
          <span className="text-[#ffb000] font-bold">
            {masteredCount}/{totalNodes}
          </span>
        </div>

        {decayCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#ff3344]/15 border border-[#ff3344] text-[#ff3344] text-[11px] animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{decayCount} DECAIMENTO FSRS</span>
          </div>
        )}

        {/* OAuth Status / Connect Button */}
        <button
          onClick={() => {
            setAuthError(null);
            setClientIdInput(oauthClientId || '');
            setShowAuthModal(true);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] transition-colors ${
            isTokenValid
              ? 'border-[#10b981]/50 text-[#10b981] bg-[#10b981]/10'
              : 'border-[#242933] text-slate-300 hover:text-white bg-[#12141a]'
          }`}
          title={isTokenValid ? 'Google OAuth Conectado' : 'Conectar com Google OAuth'}
        >
          {isTokenValid ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
              <span className="hidden sm:inline">
                {googleUser?.email ? googleUser.email.split('@')[0] : 'OAUTH ATIVO'}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="hidden sm:inline">CONECTAR GOOGLE (OAuth)</span>
            </>
          )}
        </button>
      </div>

      {/* Google OAuth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#12141a] border border-[#242933] p-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-[#242933] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
                AUTENTICAÇÃO GOOGLE OAUTH 2.0
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {isTokenValid ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#10b981]/10 border border-[#10b981] text-xs text-[#10b981] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-4 h-4" />
                    <span>Sessão OAuth Conectada com Sucesso</span>
                  </div>
                  {googleUser && (
                    <div className="text-slate-300 text-[11px] pt-1">
                      <p><strong>Usuário:</strong> {googleUser.name}</p>
                      <p><strong>Email:</strong> {googleUser.email}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 pt-1">
                    As requisições para o Gemini são assinadas diretamente via token Bearer do Google OAuth sem necessidade de API Key comercial.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="px-3 py-1.5 border border-[#242933] text-xs text-slate-400 hover:text-white"
                  >
                    FECHAR
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1 px-4 py-1.5 bg-[#ff3344]/20 border border-[#ff3344] text-[#ff3344] font-bold text-xs hover:bg-[#ff3344]/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    DESCONECTAR
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conexão direta via <strong className="text-white">Google OAuth 2.0</strong> sem custo por requisição de API Key comercial.
                  O PWA obtém um token de autorização via Google Identity Services (GIS) diretamente no navegador.
                </p>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    GOOGLE OAUTH CLIENT ID:
                  </label>
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="ex: 123456789-xyz.apps.googleusercontent.com"
                    className="w-full px-3 py-2 bg-[#0a0b0e] border border-[#242933] text-[#00f0ff] text-xs outline-hidden focus:border-[#00f0ff]"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Crie gratuitamente no Google Cloud Console com escopo Generative Language API.
                  </span>
                </div>

                {authError && (
                  <div className="p-2.5 bg-[#ff3344]/10 border border-[#ff3344] text-[#ff3344] text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-500">
                    Modo offline funciona sem OAuth.
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(false)}
                      className="px-3 py-1.5 border border-[#242933] text-xs text-slate-400 hover:text-white"
                    >
                      CANCELAR
                    </button>
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={isAuthenticating}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00f0ff] text-black font-bold text-xs hover:bg-[#38bdf8] transition-colors disabled:opacity-50"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      {isAuthenticating ? 'AUTENTICANDO...' : 'ENTRAR COM GOOGLE'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
