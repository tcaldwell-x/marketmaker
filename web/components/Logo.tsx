import { branding } from '@/lib/config';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-8 h-8', image: 32, text: 'text-xl' },
  md: { container: 'w-12 h-12', image: 48, text: 'text-2xl' },
  lg: { container: 'w-20 h-20', image: 80, text: 'text-5xl' },
};

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const { container, image, text } = sizeMap[size];
  const isImageUrl = branding.logo.startsWith('http') || branding.logo.startsWith('/');

  if (isImageUrl) {
    return (
      <div className={`${container} relative ${className}`}>
        <Image
          src={branding.logo}
          alt={branding.name}
          width={image}
          height={image}
          className="object-contain"
        />
      </div>
    );
  }

  // Emoji or text fallback
  return (
    <span className={`${text} ${className}`}>
      {branding.logo}
    </span>
  );
}
