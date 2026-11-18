export interface CreateAuthUserParams {
  email: string;
  password: string;
}

export interface AuthProviderUser {
  id: string;
  email: string;
}

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshedAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
