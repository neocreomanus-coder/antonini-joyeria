import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { type InstitutionalPageKey, getInstitutionalPage } from "@/lib/institutionalContent";

export default function InstitutionalPage({ pageKey }: { pageKey: InstitutionalPageKey }) {
  const page = getInstitutionalPage(pageKey);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20 md:pt-24">
        <section className="border-b border-gray-200 bg-[#fbfaf7]">
          <div className="container max-w-4xl py-12 md:py-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-gold">{page.eyebrow}</p>
            <h1 className="mt-3 font-sans text-3xl font-semibold tracking-[-0.035em] text-gray-950 md:text-5xl">{page.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600">{page.intro}</p>
            {page.lastUpdated && <p className="mt-5 text-xs font-medium text-gray-500">Última actualización: {page.lastUpdated}</p>}
          </div>
        </section>

        <section className="container max-w-4xl py-12 md:py-16">
          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.title} className="border-b border-gray-200 pb-10 last:border-0">
                <h2 className="font-sans text-xl font-semibold text-gray-950 md:text-2xl">{section.title}</h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-gray-600">
                  {section.paragraphs.map((paragraph, index) => <p key={`${section.title}-${index}`} className="whitespace-pre-line">{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
