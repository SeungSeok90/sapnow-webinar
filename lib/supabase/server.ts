import { createClient } from "@supabase/supabase-js";
import ws from "ws";

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인해주세요."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // @ts-ignore Node.js 20 WebSocket 폴리필
    realtime: { transport: ws },
  });
}
