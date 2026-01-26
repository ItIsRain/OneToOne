"use client";
import React, { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import Image from "next/image";

interface CoverImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId?: string;
  eventColor?: string;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/jpeg", 0.9);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

export default function CoverImageUpload({
  value,
  onChange,
  eventId,
  eventColor = "#3B82F6",
}: CoverImageUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    setError("");

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

      const response = await fetch("/api/upload/event-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: croppedImage, eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      onChange(data.url);
      handleCancelCrop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  if (isCropping && imageSrc) {
    return (
      <div className="space-y-4">
        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 5}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancelCrop}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            style={{ backgroundColor: eventColor }}
          >
            {isUploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : (
              "Save Cover"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group">
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={value}
              alt="Event cover"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Click to upload cover image
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Recommended: 1920x600 (PNG, JPG, WEBP)
          </span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
