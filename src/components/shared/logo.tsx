import Link from 'next/link';
import { Zap } from 'lucide-react'; // Example icon

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'medium', className, showText = true }: LogoProps) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-12 w-12',
  };
  const textSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
  }

  return (
    <Link href="/" className={`flex items-center gap-2 text-primary ${className}`}>
      <Zap className={`${sizeClasses[size]}`} />
      {showText && <span className={`font-bold font-headline ${textSizeClasses[size]}`}>HabitAI</span>}
    </Link>
  );
}
