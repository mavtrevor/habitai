import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/logo'
import { TriangleAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background">
      <Logo size="large" className="mb-8" />
      <TriangleAlert className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-5xl font-bold font-headline mb-4 text-foreground">404 - Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Oops! The page you&apos;re looking for doesn&apos;t seem to exist. It might have been moved or deleted.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  )
}
