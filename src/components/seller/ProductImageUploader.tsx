"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  X,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ProductImageUploader({
  images,
  onChange,
  maxImages = 8,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setErrorMessage(`You can upload a maximum of ${maxImages} images.`);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setErrorMessage(`"${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP.`);
          continue;
        }

        if (file.size > 4 * 1024 * 1024) {
          setErrorMessage(`"${file.name}" exceeds the 4MB maximum file size limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          newUrls.push(data.url);
        } else {
          setErrorMessage(data.error || `Failed to upload "${file.name}".`);
        }
      }

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }
    } catch {
      setErrorMessage("Network error while uploading images. Please check your connection.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput.trim());
      if (images.length >= maxImages) {
        setErrorMessage(`Maximum limit of ${maxImages} images reached.`);
        return;
      }
      onChange([...images, urlInput.trim()]);
      setUrlInput("");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Please enter a valid HTTP/HTTPS image URL.");
    }
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveRight = (index: number) => {
    if (index === images.length - 1) return;
    const next = [...images];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-zinc-200">
            Product Showcase Imagery ({images.length}/{maxImages})
          </label>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Upload high-resolution photographs from your device (JPEG, PNG, WebP up to 4MB). The first image serves as the primary storefront hero.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUrlField(!showUrlField)}
          className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlField ? "Hide URL input" : "Paste URL instead"}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {showUrlField && (
        <div className="flex gap-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/artisan-piece.jpg"
            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleAddUrl}>
            Add Image URL
          </Button>
        </div>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isUploading
            ? "border-amber-500/60 bg-amber-500/5"
            : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/20 hover:bg-zinc-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || images.length >= maxImages}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-mono text-amber-400">
                Verifying byte signatures and processing upload...
              </p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Click to select images from your device
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                  Supported formats: JPEG, PNG, WebP • Max 4MB per file
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-600 transition-colors"
            >
              <Image
                src={url}
                alt={`Product image ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover"
              />

              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-zinc-950 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shadow">
                  Hero Image
                </div>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleMoveLeft(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded bg-black/60 hover:bg-black text-white disabled:opacity-30 disabled:hover:bg-black/60 transition-colors"
                    title="Move left (prioritize)"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono text-zinc-300">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoveRight(idx)}
                    disabled={idx === images.length - 1}
                    className="p-1 rounded bg-black/60 hover:bg-black text-white disabled:opacity-30 disabled:hover:bg-black/60 transition-colors"
                    title="Move right"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
