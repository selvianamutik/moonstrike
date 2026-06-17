import Image from "next/image";

type AssetImageProps = {
  alt: string;
  children?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  isHidden: boolean;
};

export function PlaceholderAsset({
  alt,
  children,
  className = "",
  imageClassName = "",
  priority = false,
  isHidden = false
}: AssetImageProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.18),transparent_16rem),var(--ms-bg-card)] ${className}`}
    >
      <Image
        src="/no-image/no-img.png"
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-contain p-10 opacity-45 ${imageClassName} ${!isHidden ? "block" : "hidden"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
      {children}
    </div>
  );
}
