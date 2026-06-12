import type { IronSessionData } from "iron-session";

export interface UserSessionData {
  registrantId: string;
  name: string;
  email: string;
}

export interface AdminSessionData {
  adminId: string;
  email: string;
  name: string;
  role: "super_admin" | "manager";
}

declare module "iron-session" {
  interface IronSessionData {
    user?: UserSessionData;
    admin?: AdminSessionData;
  }
}
