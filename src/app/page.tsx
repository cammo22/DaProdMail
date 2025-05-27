"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/contexts/AppStateContext';
import { Users, FolderKanban, Send, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { customers, categories } = useAppState();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Benvenuto in DaProdMail!</h1>
        <p className="text-lg text-muted-foreground">
          Il tuo hub centrale per la gestione delle comunicazioni con i clienti.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clienti Totali</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                Gestisci tutti i contatti dei tuoi clienti in modo efficiente.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorie Totali</CardTitle>
              <FolderKanban className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Organizza i clienti in gruppi mirati.
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg col-span-full md:col-span-1 lg:col-span-1 bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Azioni Rapide</CardTitle>
              <Send className="h-5 w-5 text-primary-foreground" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/compose">
                  <Send className="mr-2 h-4 w-4" /> Componi Nuova Email
                </Link>
              </Button>
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link href="/customers">
                  <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Nuovo Cliente
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Per Iniziare</CardTitle>
                <CardDescription>Segui questi passaggi per sfruttare al meglio DaProdMail:</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2">
                    <li><Link href="/settings" className="text-primary hover:underline">Configura le Impostazioni Email</Link> per abilitare l'invio.</li>
                    <li><Link href="/customers" className="text-primary hover:underline">Aggiungi i tuoi Clienti</Link> individualmente.</li>
                    <li><Link href="/categories" className="text-primary hover:underline">Crea Categorie</Link> per raggruppare i tuoi clienti.</li>
                    <li>Assegna i clienti alle categorie per campagne mirate.</li>
                    <li><Link href="/compose" className="text-primary hover:underline">Componi un'Email</Link>, usa il potenziamento AI e inviala!</li>
                </ul>
            </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
