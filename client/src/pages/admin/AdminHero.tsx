import { Video } from "lucide-react";
import HeroVideoEditor from "./HeroVideoEditor";

export default function AdminHero() {
  return (
    <div className="mx-auto max-w-5xl p-5 md:p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white">
          <Video size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero de la Tienda</h1>
          <p className="mt-1 text-sm text-gray-500">Administra el único video fijo que se muestra en el hero principal.</p>
        </div>
      </div>

      <HeroVideoEditor />
    </div>
  );
}
