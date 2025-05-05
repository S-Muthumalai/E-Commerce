import "node";

declare global {
  namespace NodeJS {
    interface Global {
      otpStore: Record<string, { hash: string; expiresAt: number }>;
    }
  }
}

export {};