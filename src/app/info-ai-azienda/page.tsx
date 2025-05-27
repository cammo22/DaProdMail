
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppState } from '@/contexts/AppStateContext';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Download } from 'lucide-react';
import { useRef, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import type { CompanyInfo } from "@/types";

const companyInfoFormSchema = z.object({
  companyName: z.string().optional(),
  companyDetails: z.string().optional(),
  website: z.string().url({ message: "Inserisci un URL valido per il sito web." }).optional().or(z.literal('')),
});

type CompanyInfoFormValues = z.infer<typeof companyInfoFormSchema>;


export default function CompanyAiSettingsPage() {
  const { companyInfo, saveCompanyInfo } = useAppState();
  const { toast } = useToast();
  const importCompanyInfoFileRef = useRef<HTMLInputElement>(null);

  const companyInfoForm = useForm<CompanyInfoFormValues>({
    resolver: zodResolver(companyInfoFormSchema),
    defaultValues: {
      companyName: companyInfo?.companyName || "",
      companyDetails: companyInfo?.companyDetails || "",
      website: companyInfo?.website || "",
    },
  });

  useEffect(() => {
    if (companyInfo) {
      companyInfoForm.reset({
        companyName: companyInfo.companyName || "",
        companyDetails: companyInfo.companyDetails || "",
        website: companyInfo.website || "",
      });
    }
  }, [companyInfo, companyInfoForm]);

  function onCompanyInfoSubmit(data: CompanyInfoFormValues) {
    try {
      saveCompanyInfo({
        companyName: data.companyName?.trim() || "",
        companyDetails: data.companyDetails?.trim() || "",
        website: data.website?.trim() || "",
      });
      toast({ title: "Info Azienda Salvate", description: "Le informazioni sulla tua azienda sono state aggiornate per l'AI." });
    } catch (error) {
      toast({ title: "Errore", description: "Salvataggio informazioni azienda fallito.", variant: "destructive" });
      console.error(error);
    }
  }

  const handleExportCompanyInfo = () => {
    const currentCompanyInfo = companyInfoForm.getValues();
    if (!currentCompanyInfo || (!currentCompanyInfo.companyName && !currentCompanyInfo.companyDetails && !currentCompanyInfo.website)) {
        toast({ title: "Nessuna Info Azienda", description: "Non ci sono informazioni aziendali da esportare.", variant: "destructive" });
        return;
    }
    const content = [
      `companyName:${currentCompanyInfo.companyName || ""}`,
      `companyDetails:${currentCompanyInfo.companyDetails || ""}`,
      `website:${currentCompanyInfo.website || ""}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'infoaiazienda.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione Info Azienda Riuscita", description: "Le info azienda sono state esportate in infoaiazienda.txt." });
  };

  const handleImportCompanyInfoClick = () => {
    importCompanyInfoFileRef.current?.click();
  };

  const handleImportCompanyInfoFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name !== "infoaiazienda.txt" && !file.name.endsWith(".txt")) {
        toast({ title: "Nome File Errato o Formato non TXT", description: "Seleziona 'infoaiazienda.txt' o un file .txt valido.", variant: "destructive" });
        if (importCompanyInfoFileRef.current) importCompanyInfoFileRef.current.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim() === "") {
        toast({ title: "File Vuoto", description: "Il file selezionato è vuoto o illeggibile.", variant: "destructive" });
        if (importCompanyInfoFileRef.current) importCompanyInfoFileRef.current.value = "";
        return;
      }
      try {
        const lines = text.split('\n');
        const importedInfo: CompanyInfo = { 
          companyName: "",
          companyDetails: "",
          website: "",
        };
        let currentDetailLines: string[] = [];
        let isReadingDetails = false;
        let companyNameFound = false;
        let websiteFound = false;
        let companyDetailsStarted = false;

        for (const rawLine of lines) {
          const lineForCheck = rawLine.trim(); 

          if (lineForCheck.startsWith('companyName:')) {
            importedInfo.companyName = lineForCheck.substring('companyName:'.length).trim();
            isReadingDetails = false;
            companyNameFound = true;
          } else if (lineForCheck.startsWith('website:')) {
            importedInfo.website = lineForCheck.substring('website:'.length).trim();
            isReadingDetails = false;
            websiteFound = true;
          } else if (lineForCheck.startsWith('companyDetails:')) {
            currentDetailLines.push(lineForCheck.substring('companyDetails:'.length).trim());
            isReadingDetails = true;
            companyDetailsStarted = true;
          } else if (isReadingDetails) {
            currentDetailLines.push(rawLine); 
          }
        }
        
        if (companyDetailsStarted && currentDetailLines.length > 0) {
          importedInfo.companyDetails = currentDetailLines.join('\n').trim();
        }

        const validFieldsFound = companyNameFound || websiteFound || companyDetailsStarted;

        if (validFieldsFound) {
          companyInfoForm.reset({
            companyName: importedInfo.companyName || "",
            companyDetails: importedInfo.companyDetails || "",
            website: importedInfo.website || "",
          });
          toast({ title: "Info Azienda Caricate", description: "Dati caricati dal file. Clicca 'Salva Info Azienda' per applicare le modifiche." });
        } else {
          toast({ title: "Formato File Non Riconosciuto", description: "Nessun dato valido trovato nel file. Assicurati che il formato sia corretto (es. companyName:Nome).", variant: "destructive" });
        }
      } catch (error) {
        console.error("Errore durante l'importazione delle info azienda:", error);
        toast({ title: "Errore di Importazione", description: "Si è verificato un errore durante la lettura del file.", variant: "destructive" });
      } finally {
        if (importCompanyInfoFileRef.current) {
          importCompanyInfoFileRef.current.value = ""; // Reset input file
        }
      }
    };
    reader.onerror = () => {
        toast({ title: "Errore Lettura File", description: "Impossibile leggere il file selezionato.", variant: "destructive"});
        if (importCompanyInfoFileRef.current) {
            importCompanyInfoFileRef.current.value = ""; // Reset input file
        }
    }
    reader.readAsText(file);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Informazioni Azienda per AI</h1>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Dettagli Aziendali</CardTitle>
            <CardDescription>
              Fornisci dettagli sulla tua azienda per aiutare l'AI a generare testi di marketing più mirati e pertinenti.
              L'AI utilizzerà un tono formale ma amichevole, con un uso molto limitato di emoji.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...companyInfoForm}>
              <form onSubmit={companyInfoForm.handleSubmit(onCompanyInfoSubmit)} className="space-y-6">
                <FormField
                  control={companyInfoForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Azienda</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. La Mia Fantastica Impresa Srl" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyInfoForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sito Web Aziendale</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.miaimpresa.it" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyInfoForm.control}
                  name="companyDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Info sull'azienda</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descrivi la tua azienda: il settore, il pubblico target, i prodotti/servizi principali, i punti di forza unici, la mission, ecc." 
                          {...field} 
                          value={field.value || ''} 
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" variant="default">Salva Info Azienda</Button>
              </form>
            </Form>
          </CardContent>
           <CardContent className="pt-6">
             <Separator className="mb-6" />
             <CardTitle className="text-lg mb-2">Gestione Dati Info Azienda</CardTitle>
              <CardDescription className="mb-4">
                  Esporta le informazioni della tua azienda in un file o importa da un file esistente (`infoaiazienda.txt`).
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-4">
                   <Button variant="outline" onClick={handleImportCompanyInfoClick} className="w-full sm:w-auto">
                      <UploadCloud className="mr-2 h-4 w-4" /> Importa Info Azienda (TXT)
                  </Button>
                  <input
                      type="file"
                      ref={importCompanyInfoFileRef}
                      onChange={handleImportCompanyInfoFileSelected}
                      accept=".txt"
                      style={{ display: 'none' }}
                      id="import-company-info-input"
                  />
                  <Button variant="outline" onClick={handleExportCompanyInfo} className="w-full sm:w-auto">
                      <Download className="mr-2 h-4 w-4" /> Esporta Info Azienda (TXT)
                  </Button>
              </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

