import { AuthError, type RayfinClient } from '@microsoft/rayfin-client';

import type { AppSchema } from '../../rayfin/data/schema';

import { type AuthUser, type IAuthService, toAuthUser } from './IAuthService';

const localEmail = import.meta.env.VITE_LOCAL_AUTH_EMAIL;
const localPassword = import.meta.env.VITE_LOCAL_AUTH_PASSWORD;

/**
 * Local-development auth service. Used when the API URL targets localhost.
 *
 * Signs into the bundled local backend with credentials supplied through
 * local environment variables. If the account does not exist yet on the
 * local backend, it is created on first sign-in.
 */
export class MockAuthService implements IAuthService {
  readonly fabricAuthEnabled = false;

  constructor(private readonly client: RayfinClient<AppSchema>) {}

  async signIn(): Promise<AuthUser> {
    const auth = this.client.auth;
    if (!localEmail || !localPassword) throw new Error('Local authentication requires VITE_LOCAL_AUTH_EMAIL and VITE_LOCAL_AUTH_PASSWORD.');

    // Try sign-in. If the credentials are rejected (also how the backend
    // reports "user does not exist") create the account and retry. Other
    // errors (network, server, …) propagate unchanged.
    try {
      await auth.signIn({ email: localEmail, password: localPassword });
    } catch (err) {
      if (!(err instanceof AuthError) || err.code !== 'INVALID_GRANT') {
        throw err;
      }
      await auth.signUp({ email: localEmail, password: localPassword });
      await auth.signIn({ email: localEmail, password: localPassword });
    }

    const session = auth.getSession();
    if (!session.isAuthenticated || !session.user) {
      throw new Error('Local mock sign-in failed to establish a session.');
    }
    return toAuthUser(session.user);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = this.client.auth.getSession();
    if (!session.isAuthenticated || !session.user) return null;
    return toAuthUser(session.user);
  }

  async initEmbeddedAuth(): Promise<AuthUser | null> {
    // Embedded Fabric flow is not used in local-dev mode.
    return null;
  }
}
