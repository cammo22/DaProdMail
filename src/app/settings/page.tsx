
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadcnFormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/contexts/AppStateContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useState } from "react";
import Link from "next/link";

const settingsFormSchema = z.object({
  email: z.string().email({ message: "Indirizzo email non valido." }).optional().or(z.literal('')),
  appPassword: z.string().optional(),
  googleApiKey: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { emailSettings, saveEmailSettings } = useAppState();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      email: emailSettings?.email || "",
      appPassword: emailSettings?.appPassword || "",
      googleApiKey: emailSettings?.googleApiKey || "",
    },
  });

  function onSubmit(data: SettingsFormValues) {
    try {
      saveEmailSettings({
        email: data.email ? data.email.trim() : "",
        appPassword: data.appPassword ? data.appPassword.trim() : undefined,
        googleApiKey: data.googleApiKey ? data.googleApiKey.trim() : undefined,
      });
      toast({ title: "Impostazioni Salvate", description: "Le tue impostazioni email e API sono state aggiornate." });
    } catch (error) {
      toast({ title: "Errore", description: "Salvataggio impostazioni fallito.", variant: "destructive" });
      console.error(error);
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-primary">Impostazioni Applicazione</h1>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configurazione Email</CardTitle>
            <CardDescription>
              Configura il tuo account Google Mail per l'invio di email. Dovrai generare una Password per app dalle impostazioni del tuo Account Google.
              La Chiave API di Google è necessaria per la funzione di miglioramento email tramite AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indirizzo Email Google Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tua.email@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password per App Google Mail</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••••••••••" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? "Nascondi password" : "Mostra password"}</span>
                        </Button>
                      </div>
                      <ShadcnFormDescription>
                        Genera una Password per app dalle impostazioni di sicurezza del tuo Account Google.
                      </ShadcnFormDescription>
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
                          Vai alla pagina Password per App <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="googleApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiave API Google AI</FormLabel>
                       <div className="relative">
                        <FormControl>
                          <Input type={showApiKey ? "text" : "password"} placeholder="Inserisci la tua Chiave API Google AI" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           <span className="sr-only">{showApiKey ? "Nascondi chiave API" : "Mostra chiave API"}</span>
                        </Button>
                      </div>
                      <ShadcnFormDescription>
                        Ottieni questa chiave da Google AI Studio per la funzione di miglioramento email.
                      </ShadcnFormDescription>
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                           Vai a Google AI Studio <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="default">Salva Impostazioni</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
