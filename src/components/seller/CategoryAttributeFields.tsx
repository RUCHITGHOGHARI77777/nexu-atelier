"use client";

import React, { useEffect, useState } from "react";
import { CategoryAttributeDefinition, ProductAttributesMap } from "@/types/listing-engine";
import { Layers, HelpCircle, Check } from "lucide-react";

interface CategoryAttributeFieldsProps {
  categoryId: string;
  categoryName?: string;
  attributes: ProductAttributesMap;
  onChange: (updated: ProductAttributesMap) => void;
  disabled?: boolean;
}

export function CategoryAttributeFields({
  categoryId,
  categoryName,
  attributes,
  onChange,
  disabled = false,
}: CategoryAttributeFieldsProps) {
  const [definitions, setDefinitions] = useState<CategoryAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setDefinitions([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/categories/${categoryId}/attributes`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.attributes)) {
          setDefinitions(data.attributes);
        } else {
          setDefinitions([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load category specifications.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  if (!categoryId) {
    return (
      <div className="p-5 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-zinc-500 text-sm">
        Select a category above to load category-specific artisan attributes and technical specifications.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center gap-2 text-zinc-400 text-sm">
        <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        <span>Loading tailored specifications for {categoryName || "category"}...</span>
      </div>
    );
  }

  if (definitions.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 text-xs text-zinc-500 flex items-center gap-2">
        <Layers className="w-4 h-4 text-zinc-400 shrink-0" />
        <span>No custom specification requirements configured for this category yet.</span>
      </div>
    );
  }

  const handleValueChange = (slug: string, value: any, unit?: string | null) => {
    const existingEntry = attributes[slug] || {};
    const updatedUnit = unit !== undefined ? unit : existingEntry.unit || null;
    onChange({
      ...attributes,
      [slug]: {
        value,
        unit: updatedUnit,
      },
    });
  };

  const handleUnitChange = (slug: string, unit: string) => {
    const existingEntry = attributes[slug] || { value: "" };
    onChange({
      ...attributes,
      [slug]: {
        ...existingEntry,
        unit,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-700" />
          <span>Category Specifications — {categoryName || "Tailored Fields"}</span>
        </h4>
        <span className="text-[11px] text-zinc-400">
          Tailored to category • {definitions.filter((d) => d.isRequired).length} Required
        </span>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {definitions.map((def) => {
          const entry = attributes[def.slug] || { value: "", unit: def.defaultUnit || null };
          const value = entry.value;
          const currentUnit = entry.unit || def.defaultUnit || (def.allowedUnits[0] || null);

          return (
            <div
              key={def.id}
              className={`p-3.5 rounded-xl border transition-all ${
                def.isRequired ? "bg-white border-zinc-200" : "bg-zinc-50/30 border-zinc-200/80"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                  <span>{def.name}</span>
                  {def.isRequired && <span className="text-rose-500 font-bold">*</span>}
                </label>
                {def.validationRules && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                    <HelpCircle className="w-2.5 h-2.5" />
                    {def.validationRules.min !== undefined && `Min: ${def.validationRules.min}`}
                    {def.validationRules.max !== undefined && ` Max: ${def.validationRules.max}`}
                  </span>
                )}
              </div>

              {/* RENDER BASED ON DATA TYPE */}
              {def.dataType === "DROPDOWN" && (
                <select
                  disabled={disabled}
                  value={value || ""}
                  onChange={(e) => handleValueChange(def.slug, e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="">Select {def.name}...</option>
                  {def.allowedValues.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {def.dataType === "MEASUREMENT" && (
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    disabled={disabled}
                    placeholder="Enter value"
                    value={value !== undefined ? value : ""}
                    onChange={(e) => handleValueChange(def.slug, e.target.value ? Number(e.target.value) : "")}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  {def.allowedUnits && def.allowedUnits.length > 0 ? (
                    <select
                      disabled={disabled}
                      value={currentUnit || ""}
                      onChange={(e) => handleUnitChange(def.slug, e.target.value)}
                      className="w-24 px-2 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 font-medium focus:outline-none"
                    >
                      {def.allowedUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-3 py-2 text-xs bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-600 font-medium">
                      {def.defaultUnit || "-"}
                    </span>
                  )}
                </div>
              )}

              {def.dataType === "MULTI_SELECT" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {def.allowedValues.map((opt) => {
                    const selected = Array.isArray(value) && value.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const arr = Array.isArray(value) ? [...value] : [];
                          const idx = arr.indexOf(opt);
                          if (idx >= 0) arr.splice(idx, 1);
                          else arr.push(opt);
                          handleValueChange(def.slug, arr);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors flex items-center gap-1 ${
                          selected
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {def.dataType === "BOOLEAN" && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleValueChange(def.slug, true)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      value === true
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleValueChange(def.slug, false)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                      value === false
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    No
                  </button>
                </div>
              )}

              {def.dataType === "STRUCTURED_SPECS" && (
                <div className="grid grid-cols-3 gap-2">
                  {["length", "width", "height"].map((dimension) => {
                    const struct = typeof value === "object" && value !== null ? value : {};
                    return (
                      <div key={dimension}>
                        <input
                          type="number"
                          step="any"
                          disabled={disabled}
                          placeholder={dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                          value={struct[dimension] !== undefined ? struct[dimension] : ""}
                          onChange={(e) => {
                            const newStruct = {
                              ...struct,
                              [dimension]: e.target.value ? Number(e.target.value) : "",
                            };
                            handleValueChange(def.slug, newStruct, currentUnit);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {def.dataType === "NUMBER" && (
                <input
                  type="number"
                  step="any"
                  disabled={disabled}
                  placeholder={`Enter ${def.name.toLowerCase()}`}
                  value={value !== undefined ? value : ""}
                  onChange={(e) => handleValueChange(def.slug, e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              )}

              {def.dataType === "TEXT" && (
                <input
                  type="text"
                  disabled={disabled}
                  placeholder={`Enter ${def.name.toLowerCase()}`}
                  value={value || ""}
                  onChange={(e) => handleValueChange(def.slug, e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
