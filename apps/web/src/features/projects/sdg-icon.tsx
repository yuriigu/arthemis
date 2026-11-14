"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SdgIcon({
  iconUrl,
  number,
  name,
  className,
}: {
  iconUrl?: string | null;
  number: string | number;
  name: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const label = `ODS ${number}: ${name}`;
  const imageSrc = imageFailed ? undefined : iconUrl;
  const showImage = Boolean(imageSrc);

  return (
    <span
      role={showImage ? undefined : "img"}
      aria-label={showImage ? undefined : `${label} — ícone indisponível`}
      title={label}
      className={cn(
        "relative grid aspect-square overflow-hidden rounded-md bg-muted",
        className,
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={label}
          title={label}
          fill
          sizes="96px"
          unoptimized
          onError={() => setImageFailed(true)}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-full place-items-center px-1 text-center text-xs font-semibold text-muted-foreground"
        >
          ODS {number}
        </span>
      )}
    </span>
  );
}
 