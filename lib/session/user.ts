import { SessionOptions } from "iron-session";

export const userSessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: "user_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24시간
  },
};
