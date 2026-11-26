"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

export function OptionalPhoto({ src, alt, width, height, className, sizes, loading, children }: {
  src?: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  loading?: "eager" | "lazy";
  children: ReactNode;
}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || src === failedSrc) return children;

  return (
    <Image
      unoptimized={!sizes}
      sizes={sizes}
      loading={loading}
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      onError={() => setFailedSrc(src)}
    />
  );
}
