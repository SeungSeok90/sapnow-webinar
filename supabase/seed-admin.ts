/**
 * 관리자 초기 계정 생성 스크립트
 * 실행: npx tsx supabase/seed-admin.ts
 * (.env.local 값을 환경변수로 먼저 설정해야 합니다)
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import ws from "ws";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const seedEmail = process.env.ADMIN_SEED_EMAIL!;
const seedPassword = process.env.ADMIN_SEED_PASSWORD!;

if (!supabaseUrl || !serviceRoleKey || !seedEmail || !seedPassword) {
  console.error("필수 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  // @ts-ignore Node.js 20 WebSocket 폴리필
  realtime: { transport: ws },
});

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const { error } = await supabase.from("admin_users").upsert(
    {
      email: seedEmail,
      password_hash: passwordHash,
      name: "관리자",
      role: "super_admin",
      is_active: true,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("시딩 실패:", error.message);
    process.exit(1);
  }

  console.log(`✅ 관리자 계정 생성 완료: ${seedEmail}`);
}

seedAdmin();
