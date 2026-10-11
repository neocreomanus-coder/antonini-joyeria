import { X } from "lucide-react";
import { MATERIAL_OPTIONS, normalizeMaterialValue } from "@/lib/materialOptions";

type MaterialPickerProps = {
  values: string[];
  onChange: (values: string[]) => void;
  customStoneName: string;
  customStoneColor: string;
  onCustomStoneChange: (stone: { name: string; color: string }) => void;
};

export default function MaterialPicker({ values, onChange, customStoneName, customStoneColor, onCustomStoneChange }: MaterialPickerProps) {
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
      <div className={`col-span-2 flex min-h-20 items-center gap-2.5 rounded-xl border px-3 py-2 sm:col-span-3 ${customStoneName.trim() ? "border-brand-green bg-brand-green/5 ring-1 ring-brand-green" : "border-dashed border-gray-300 bg-gray-50"}`}>
        <span className="h-9 w-9 shrink-0 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: customStoneColor || "#7c3aed" }} />
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-bold leading-tight text-gray-900" htmlFor="custom-stone-name">Piedra personalizada</label>
          <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <input
              id="custom-stone-name"
              type="text"
              value={customStoneName}
              maxLength={100}
              onChange={(event) => onCustomStoneChange({ name: event.target.value, color: customStoneColor })}
              placeholder="Nombre de la piedra"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-brand-green"
            />
            <label className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-gray-500" title="Elige el color de la piedra">
              Color
              <input
                aria-label="Color de la piedra personalizada"
                type="color"
                value={customStoneColor || "#7c3aed"}
                onChange={(event) => onCustomStoneChange({ name: customStoneName, color: event.target.value })}
                className="h-8 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
              />
            </label>
          </div>
        </div>
        {customStoneName.trim() && (
          <button type="button" onClick={() => onCustomStoneChange({ name: "", color: "#7c3aed" })} className="self-start rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500" aria-label="Quitar piedra personalizada">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
