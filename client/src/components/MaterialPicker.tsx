import { MATERIAL_OPTIONS, normalizeMaterialValue } from "@/lib/materialOptions";

type MaterialPickerProps = {
  values: string[];
  onChange: (values: string[]) => void;
};

export default function MaterialPicker({ values, onChange }: MaterialPickerProps) {
  const selectedValues = values.length > 0 ? values.map(normalizeMaterialValue) : ["ORO 18K NACIONAL"];

  const toggleMaterial = (value: string) => {
    const isSelected = selectedValues.includes(value);
    if (isSelected && selectedValues.length === 1) return;
    onChange(isSelected ? selectedValues.filter((item) => item !== value) : [...selectedValues, value]);
  };

  return (
    <div role="group" aria-label="Materiales del producto" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {MATERIAL_OPTIONS.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => toggleMaterial(option.value)}
            className={`flex min-h-20 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${isSelected ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green" : "border-gray-200 bg-white hover:border-gray-400"}`}
          >
            <span className={`h-9 w-9 shrink-0 rounded-full border border-black/10 shadow-inner ${option.swatchClass}`} />
            <span className="min-w-0">
              <span className="block text-xs font-bold leading-tight text-gray-900">{option.label}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">{option.detail}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
