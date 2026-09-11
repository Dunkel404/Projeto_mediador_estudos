/**
 * Google Identity Services (GIS) OAuth 2.0 Client for Gemini PWA
 * Direct client-side OAuth without exposing or paying for commercial API keys.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              expires_in?: number;
              error?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface OAuthState {
  accessToken: string | null;
  expiresAt: number | null; // Timestamp in ms
  clientId: string;
  user: GoogleUserProfile | null;
}

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/generative-language',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export class GoogleOAuthService {
  private scriptLoaded: boolean = false;

  public async loadGisScript(): Promise<void> {
    if (this.scriptLoaded || typeof window === 'undefined') return;

    if (window.google?.accounts?.oauth2) {
      this.scriptLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services script.'));
      document.head.appendChild(script);
    });
  }

  public async requestOAuthToken(
    clientId: string
  ): Promise<{ accessToken: string; expiresIn: number; user?: GoogleUserProfile }> {
    await this.loadGisScript();

    if (!window.google?.accounts?.oauth2) {
      throw new Error('Google Identity Services não está disponível.');
    }

    return new Promise((resolve, reject) => {
      try {
        const tokenClient = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DEFAULT_SCOPES,
          callback: async (response) => {
            if (response.error) {
              reject(new Error(`Erro de autenticação Google OAuth: ${response.error}`));
              return;
            }

            if (response.access_token) {
              let user: GoogleUserProfile | undefined = undefined;
              try {
                // Fetch user profile info with token
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                });
                if (userRes.ok) {
                  user = await userRes.json();
                }
              } catch (e) {
                console.warn('Could not fetch user profile info:', e);
              }

              resolve({
                accessToken: response.access_token,
                expiresIn: response.expires_in || 3599,
                user,
              });
            } else {
              reject(new Error('Nenhum access token retornado no fluxo OAuth.'));
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  public revokeToken(token: string): Promise<void> {
    return new Promise((resolve) => {
      if (window.google?.accounts?.oauth2 && token) {
        window.google.accounts.oauth2.revoke(token, () => resolve());
      } else {
        resolve();
      }
    });
  }
}

export const googleOAuth = new GoogleOAuthService();
