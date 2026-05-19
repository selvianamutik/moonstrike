import Image from "next/image";

type AssetImageProps = {
  alt: string;
  children?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function PlaceholderAsset({
  alt,
  children,
  className = "",
  imageClassName = "",
  priority = false,
}: AssetImageProps) {
  return (
    <div className={`relative overflow-hidden bg-[#efeff2] ${className}`}>
      <Image
        src="/no-image/no-img.png"
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={`object-contain p-10 opacity-55 ${imageClassName}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
      {children}
    </div>
  );
}
