export type User = {
  id: string; // uuid generado localmente
  username: string; // único, case-insensitive
  passwordHash: string; // SHA-256 (expo-crypto digestStringAsync) — nunca texto plano
  createdAt: string; // ISO date
};
