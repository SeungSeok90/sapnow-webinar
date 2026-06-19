import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CategoryImage from "@/components/info/CategoryImage";
import { getInfoCategory, INFO_CATEGORIES } from "@/content/info-categories";

export function generateStaticParams() {
  // externalUrl 카테고리는 정적 생성에서 제외 — redirect()가 요청 시점에
  // 실행돼야 실제 HTTP Location 헤더로 리다이렉트된다 (정적 생성 시에는
  // 클라이언트 라우터 의존적인 리다이렉트가 되어버림).
  return INFO_CATEGORIES.filter((category) => !category.externalUrl).map(
    (category) => ({ category: category.slug })
  );
}

export default async function InfoCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getInfoCategory(slug);

  if (!category) {
    notFound();
  }

  if (category.externalUrl) {
    redirect(category.externalUrl);
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-sapnow">
      <div className="relative w-full max-w-[700px]">
        <Link
          href="/info"
          className="absolute right-4 top-4 z-10 rounded-lg bg-white/90 px-4 py-2 font-bold text-sapnow shadow"
        >
          ← 뒤로가기
        </Link>
        <CategoryImage src={category.image!} alt={category.title} />
      </div>
    </main>
  );
}
