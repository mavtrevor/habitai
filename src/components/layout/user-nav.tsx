'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { mockUser } from '@/lib/mock-data'; // Using mock data for display
import { signOut } from '@/lib/firebase'; // Using real signOut
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types';
// import { auth } from '@/lib/firebase/client'; // For onAuthStateChanged later
// import type { User as FirebaseUser } from 'firebase/auth'; // For onAuthStateChanged later

export function UserNav() {
  const [user, setUser] = useState<UserProfile | null>(null); // Will be UserProfile from Firebase eventually
  const router = useRouter();

  useEffect(() => {
    // TODO: Implement onAuthStateChanged listener here to set real user
    // For now, we continue to use mockUser for display purposes until full auth state management.
    setUser(mockUser); 
    
    // Example of onAuthStateChanged (for future implementation):
    // const unsubscribe = auth.onAuthStateChanged((firebaseUser: FirebaseUser | null) => {
    //   if (firebaseUser) {
    //     // Map firebaseUser to UserProfile type
    //     setUser({
    //       id: firebaseUser.uid,
    //       name: firebaseUser.displayName || "User",
    //       email: firebaseUser.email || "",
    //       avatarUrl: firebaseUser.photoURL || undefined,
    //       createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
    //       // ... other properties from your UserProfile type, possibly fetched from Firestore
    //     });
    //   } else {
    //     setUser(null);
    //   }
    // });
    // return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally show a toast message for logout failure
    }
  };

  if (!user) {
    return (
       <Button variant="ghost" size="icon" className="rounded-full">
         <Avatar className="h-8 w-8">
           <AvatarFallback>U</AvatarFallback>
         </Avatar>
       </Button>
    );
  }
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person avatar" />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile" passHref>
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/settings" passHref>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
