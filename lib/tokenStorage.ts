import { AuthTokens } from "@/types/auth";
import { TOKENS_STORAGE_KEY } from "@/constants/tokenStorage";

export const getTokens = () => {
  const tokensRaw = localStorage.getItem(TOKENS_STORAGE_KEY);

  return tokensRaw ? (JSON.parse(tokensRaw) as AuthTokens) : null;
};

export const clearTokens = () => {
  localStorage.removeItem(TOKENS_STORAGE_KEY);
};

export const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
};
