import Link from "next/link";
import InfoHeader from "@/components/info/InfoHeader";
import { INFO_CATEGORIES } from "@/content/info-categories";

export default function InfoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <InfoHeader title="SAP NOW AI Tour KOREA" />

      <div className="mx-auto max-w-[480px] space-y-3 px-4 py-6">
        {INFO_CATEGORIES.map((category) => {
          const cardClassName =
            "flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition active:scale-[0.98]";
          const cardContent = (
            <>
              <span className="text-2xl">{category.emoji}</span>
              <span className="flex-1">
                <span className="block font-semibold text-gray-900">
                  {category.title}
                </span>
                <span className="block text-sm text-gray-500">
                  {category.description}
                </span>
              </span>
              <span className="text-gray-300">→</span>
            </>
          );

          return category.externalUrl ? (
            <a
              key={category.slug}
              href={category.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClassName}
            >
              {cardContent}
            </a>
          ) : (
            <Link
              key={category.slug}
              href={`/info/${category.slug}`}
              className={cardClassName}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
