"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface MemoryFormProps {
  lat: number;
  lng: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MemoryForm({
  lat,
  lng,
  onSuccess,
  onCancel,
}: MemoryFormProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      // 1. Upload Image (if exists)
      if (image) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("memories")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("memories").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // 2. Insert to Database
      const { error: insertError } = await supabase.from("memories").insert([
        {
          content,
          image_url: imageUrl,
          latitude: lat,
          longitude: lng,
          // user_id will be handled by RLS if using auth, or we can add it here if we have context
        },
      ]);

      if (insertError) throw insertError;

      // Show success animation
      setSuccess(true);

      // Wait 2 seconds before closing and showing the saved memory
      setTimeout(() => {
        setSuccess(false);
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Error saving memory:", error);
      alert("Failed to save memory. Check console for details.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative w-[340px] p-6 rounded-2xl 
                  bg-gradient-to-br from-zinc-900/95 to-black/90 
                  backdrop-blur-xl border border-white/10 
                  shadow-[0_0_40px_rgba(139,92,246,0.15)]"
    >
      {/* Glow background accent */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl" />

      {/* Success Overlay */}
      {success && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center 
                        bg-gradient-to-br from-purple-600/95 to-rose-500/95 
                        rounded-2xl backdrop-blur-xl
                        animate-[fadeIn_0.3s_ease-out]"
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full animate-[float_2s_ease-in-out_infinite]"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: Math.random() * 0.7 + 0.3,
                }}
              />
            ))}
          </div>

          {/* Success Icon */}
          <div
            className="relative z-10 mb-4 w-20 h-20 rounded-full 
                          bg-white/20 backdrop-blur-sm 
                          flex items-center justify-center
                          animate-[scaleIn_0.5s_ease-out]"
          >
            <svg
              className="w-12 h-12 text-white animate-[checkmark_0.6s_ease-out_0.2s_both]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Text */}
          <h3 className="text-2xl font-bold text-white mb-2 animate-[slideUp_0.5s_ease-out_0.3s_both]">
            Memory Saved! 🎉
          </h3>
          <p className="text-white/80 text-sm animate-[slideUp_0.5s_ease-out_0.4s_both]">
            Your story is now part of the map
          </p>
        </div>
      )}

      <h3 className="text-2xl font-semibold text-white tracking-wide mb-1">
        Leave a Memory
      </h3>
      <p className="text-sm text-zinc-400 mb-5 italic">
        Pin your story into this place forever.
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 relative z-10"
      >
        {/* Textarea */}
        <textarea
          className="w-full min-h-[100px] p-4 rounded-xl 
                   bg-white/5 text-white placeholder:text-zinc-500 
                   border border-white/10 
                   focus:outline-none focus:ring-2 
                   focus:ring-purple-500/50 
                   transition-all duration-300 resize-none"
          placeholder="What happened here?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={loading || success}
        />

        {/* Image Upload */}
        <label
          className="group relative flex flex-col items-center justify-center 
                        border border-dashed border-white/20 
                        rounded-xl p-5 cursor-pointer 
                        hover:border-purple-400/60 
                        transition-all duration-300"
        >
          <span className="text-sm text-zinc-400 group-hover:text-purple-300 transition">
            {image ? image.name : "Attach a photo to remember this moment"}
          </span>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            disabled={loading || success}
          />
        </label>

        {/* Buttons */}
        <div className="flex justify-between items-center mt-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-zinc-400 hover:text-white transition"
            disabled={loading || success}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || success}
            className="px-5 py-2 rounded-full text-sm font-medium 
                     bg-gradient-to-r from-purple-600 to-rose-500 
                     text-white shadow-lg 
                     hover:scale-105 hover:shadow-purple-500/40 
                     transition-all duration-300 
                     disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Memory"}
          </button>
        </div>
      </form>
    </div>
  );
}
