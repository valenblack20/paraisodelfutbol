/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    admin: {
      authenticated: boolean;
      user: {
        id: number;
        email: string;
        displayName: string;
      } | null;
      session: {
        tokenHash: string;
        csrfTokenHash: string;
        expiresAt: Date;
      } | null;
    };
  }
}