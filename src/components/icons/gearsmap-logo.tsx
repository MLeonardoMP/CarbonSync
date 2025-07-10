import Image from 'next/image';

interface GearsmapLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function GearsmapLogo({ className, width = 40, height = 64 }: GearsmapLogoProps) {
  return (
    <Image
      src="/LOGO-GEARS-MAP_ico.ico"
      alt="Gearsmap Logo"
      width={width}
      height={height}
      className={className}
    />
  );
}
