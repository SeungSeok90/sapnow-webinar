import { SessionOptions } from "iron-session";

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8시간
  },
};
