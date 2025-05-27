
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
import { Eye, EyeOff, ExternalLink, UploadCloud, Download } from 'lucide-react';
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

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
  const importCredentialsFileRef = useRef<HTMLInputElement>(null);

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      email: emailSettings?.email || "",
      appPassword: emailSettings?.appPassword || "",
      googleApiKey: emailSettings?.googleApiKey || "",
    },
  });

  useEffect(() => {
    settingsForm.reset({
      email: emailSettings?.email || "",
      appPassword: emailSettings?.appPassword || "",
      googleApiKey: emailSettings?.googleApiKey || "",
    });
  }, [emailSettings, settingsForm]);


  function onSettingsSubmit(data: SettingsFormValues) {
    try {
      saveEmailSettings({
        email: data.email ? data.email.trim() : "",
        appPassword: data.appPassword ? data.appPassword.trim() : undefined,
        googleApiKey: data.googleApiKey ? data.googleApiKey.trim() : undefined,
      });
      toast({ title: "Impostazioni Email Salvate", description: "Le tue impostazioni email e API sono state aggiornate." });
    } catch (error) {
      toast({ title: "Errore", description: "Salvataggio impostazioni email fallito.", variant: "destructive" });
      console.error(error);
    }
  }

  const handleExportCredentials = () => {
    const currentSettings = settingsForm.getValues();
    if (!currentSettings.email && !currentSettings.appPassword && !currentSettings.googleApiKey) {
        toast({ title: "Nessuna Credenziale", description: "Non ci sono credenziali da esportare.", variant: "destructive" });
        return;
    }
    const content = [
        `email:${currentSettings.email || ""}`,
        `appPassword:${currentSettings.appPassword || ""}`,
        `googleApiKey:${currentSettings.googleApiKey || ""}`
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'credenzialidaprodmail.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione Credenziali Riuscita", description: "Le credenziali sono state esportate in credenzialidaprodmail.txt." });
  };

  const handleImportCredentialsClick = () => {
    importCredentialsFileRef.current?.click();
  };

  const handleImportCredentialsFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name !== "credenzialidaprodmail.txt" && !file.name.endsWith(".txt")) {
        toast({ title: "Nome File Errato o Formato non TXT", description: "Seleziona 'credenzialidaprodmail.txt' o un file .txt valido.", variant: "destructive" });
        if (importCredentialsFileRef.current) importCredentialsFileRef.current.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim() === "") {
        toast({ title: "File Vuoto", description: "Il file selezionato è vuoto o illeggibile.", variant: "destructive" });
        if (importCredentialsFileRef.current) importCredentialsFileRef.current.value = "";
        return;
      }
      try {
        const lines = text.split('\n');
        const importedSettings: Partial<SettingsFormValues> = {
            email: "",
            appPassword: "",
            googleApiKey: ""
        };
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('email:')) importedSettings.email = trimmedLine.substring('email:'.length);
          else if (trimmedLine.startsWith('appPassword:')) importedSettings.appPassword = trimmedLine.substring('appPassword:'.length);
          else if (trimmedLine.startsWith('googleApiKey:')) importedSettings.googleApiKey = trimmedLine.substring('googleApiKey:'.length);
        });
        
        const foundValidData = importedSettings.email || importedSettings.appPassword || importedSettings.googleApiKey;

        if (foundValidData) {
            settingsForm.reset({
                email: importedSettings.email || "",
                appPassword: importedSettings.appPassword || "",
                googleApiKey: importedSettings.googleApiKey || ""
            });
            toast({ title: "Credenziali Caricate", description: "Dati caricati dal file. Clicca 'Salva Impostazioni Email' per applicare le modifiche." });
        } else {
             toast({ title: "Formato File Non Riconosciuto", description: "Nessun dato valido trovato nel file. Assicurati che il formato sia corretto (es. email:tua@email.com).", variant: "destructive" });
        }

      } catch (error) {
        console.error("Errore durante l'importazione delle credenziali:", error);
        toast({ title: "Errore di Importazione", description: "Si è verificato un errore durante la lettura del file.", variant: "destructive" });
      } finally {
        if (importCredentialsFileRef.current) {
          importCredentialsFileRef.current.value = ""; // Reset input file
        }
      }
    };
    reader.onerror = () => {
        toast({ title: "Errore Lettura File", description: "Impossibile leggere il file selezionato.", variant: "destructive"});
        if (importCredentialsFileRef.current) {
            importCredentialsFileRef.current.value = ""; // Reset input file
        }
    }
    reader.readAsText(file);
  };


  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Impostazioni Applicazione</h1>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configurazione Email e API Google</CardTitle>
            <CardDescription>
              Configura il tuo account Google Mail per l'invio di email e la tua chiave API Google per le funzionalità AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...settingsForm}>
              <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-8">
                <FormField
                  control={settingsForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indirizzo Email Google Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tua.email@gmail.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingsForm.control}
                  name="appPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password per App Google Mail</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••••••••••" {...field} value={field.value || ''} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  control={settingsForm.control}
                  name="googleApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chiave API Google AI</FormLabel>
                       <div className="relative">
                        <FormControl>
                          <Input type={showApiKey ? "text" : "password"} placeholder="Inserisci la tua Chiave API Google AI" {...field} value={field.value || ''} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowApiKey(!showApiKey)}
                           aria-label={showApiKey ? "Nascondi chiave API" : "Mostra chiave API"}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <Button type="submit" variant="default">Salva Impostazioni Email</Button>
              </form>
            </Form>
          </CardContent>
          <CardContent className="pt-6">
             <Separator className="mb-6" />
             <CardTitle className="text-lg mb-2">Gestione Credenziali</CardTitle>
              <CardDescription className="mb-4">
                  Esporta le tue credenziali attuali in un file o importa da un file esistente (`credenzialidaprodmail.txt`).
                  <br />
                  <span className="font-semibold text-destructive">Attenzione:</span> L'esportazione di credenziali in file di testo è rischiosa. Maneggia il file con cura.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4">
                   <Button variant="outline" onClick={handleImportCredentialsClick} className="w-full sm:w-auto">
                      <UploadCloud className="mr-2 h-4 w-4" /> Importa Credenziali (TXT)
                  </Button>
                  <input
                      type="file"
                      ref={importCredentialsFileRef}
                      onChange={handleImportCredentialsFileSelected}
                      accept=".txt"
                      style={{ display: 'none' }}
                      id="import-credentials-input"
                  />
                  <Button variant="outline" onClick={handleExportCredentials} className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" /> Esporta Credenziali (TXT)
                  </Button>
              </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

    
