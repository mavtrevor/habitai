'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex flex-1 flex-col items-center justify-center h-full p-6 text-center bg-destructive/10 rounded-lg border border-destructive">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold font-headline text-destructive mb-2">Something went wrong!</h2>
      <p className="text-destructive/80 mb-6 max-w-md">
        {error.message || "An unexpected error occurred. Please try again or contact support if the issue persists."}
      </p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        variant="destructive"
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Try again
      </Button>
    </div>
  )
}
