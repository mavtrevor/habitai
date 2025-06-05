import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center h-full">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
