"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Layers,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Package,
} from "lucide-react";
import { AdminCategoryView } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryView | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load categories.");
      }
    } catch {
      setActionError("Network error while loading categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("/images/categories/living.jpg");
    setIsModalOpen(true);
    setActionError(null);
  };

  const openEditModal = (cat: AdminCategoryView) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image);
    setIsModalOpen(true);
    setActionError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setActionError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim() || undefined,
            description: description.trim(),
            image: image.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Category "${name}" updated successfully.`);
          setIsModalOpen(false);
          fetchCategories();
        } else {
          setActionError(data.error || "Failed to update category.");
        }
      } else {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim() || undefined,
            description: description.trim(),
            image: image.trim(),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Category "${name}" created successfully.`);
          setIsModalOpen(false);
          fetchCategories();
        } else {
          setActionError(data.error || "Failed to create category.");
        }
      }
    } catch {
      setActionError("Network error saving category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cat: AdminCategoryView) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Category "${cat.name}" deleted.`);
        fetchCategories();
      } else {
        setActionError(data.error || "Failed to delete category.");
      }
    } catch {
      setActionError("Network error deleting category.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            Taxonomy Architecture
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mt-1">
            Category & Department Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Govern public storefront navigation hierarchy, curation banners, and collection classifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-zinc-100 text-zinc-900 hover:bg-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading marketplace taxonomies...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 border border-zinc-800 rounded bg-zinc-900/20 text-center space-y-3">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No categories found</h3>
          <p className="text-xs text-zinc-500">Create your first product department taxonomy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="border border-zinc-800 bg-[#09090b] rounded-xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div className="relative h-40 w-full bg-zinc-900 overflow-hidden">
                <Image
                  src={cat.image || "/images/categories/living.jpg"}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      /{cat.slug}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 rounded-full border border-white/20">
                    {cat.productCount} creations
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {cat.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500">
                    ID: {cat.id.slice(0, 10)}...
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Edit Category"
                      aria-label="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={cat.productCount > 0}
                      className="p-1.5 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 transition-colors"
                      title={cat.productCount > 0 ? "Cannot delete category with products" : "Delete Category"}
                      aria-label="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>{editingCategory ? "Edit Category Taxonomy" : "Create New Category"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Category Display Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fine Textiles"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  URL Slug (Optional, auto-generated from name)
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. fine-textiles"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Showcase Image URL
                </label>
                <Input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/images/categories/living.jpg"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisan handloomed wool, raw silk stoles, and heirloom bed dressings."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-zinc-100 text-zinc-900 hover:bg-white"
                >
                  {isSubmitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
