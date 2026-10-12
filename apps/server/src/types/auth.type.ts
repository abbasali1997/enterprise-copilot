import { z } from "zod";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthResponse =
  | {
      status: "authenticated";
      user: { id: string; name: string; email: string };
      workspace: {
        id: string;
        name: string;
        slug: string;
        role: "OWNER" | "ADMIN" | "MEMBER";
        logoUrl: string | null;
      };
      accessToken: string;
      expiresIn: number;
    }
  | {
      status: "workspace_selection_required";
      user: { id: string; name: string; email: string };
      workspaces: Array<{
        id: string;
        name: string;
        slug: string;
        role: "OWNER" | "ADMIN" | "MEMBER";
        logoUrl: string | null;
      }>;
      selectionToken: string;
      expiresIn: number;
    };
