import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/polls');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="py-4 px-6 border-b bg-white">
        <div className="container mx-auto flex justify-center">
          <h1 className="text-2xl font-bold text-slate-800">ALX Polly</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="py-4 px-6 border-t bg-white">
        <div className="container mx-auto text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} ALX Polly. All rights reserved.
        </div>
      </footer>
    </div>
  );
}