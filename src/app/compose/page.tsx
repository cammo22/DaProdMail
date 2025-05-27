
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadcnFormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/contexts/AppStateContext';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Send, Loader2, Sparkles, Search, CheckSquare, XSquare, ImagePlus, Trash2 } from 'lucide-react';
import { sendEmailAction, improveEmailTextAction, improveEmailSubjectAction, type EmailRecipient } from './actions';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Customer } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label"; // Assicurati che Label sia importato
import NextImage from 'next/image'; // Per l'anteprima
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const emailFormSchema = z.object({
  recipientType: z.enum(["category", "individual"], { required_error: "Seleziona un tipo di destinatario." }),
  categoryId: z.string().optional(),
  customerIds: z.array(z.string()).optional(),
  subject: z.string().min(1, { message: "L'oggetto non può essere vuoto." }),
  body: z.string().min(1, { message: "Il corpo dell'email non può essere vuoto." }),
}).refine(data => {
  if (data.recipientType === "category") return !!data.categoryId;
  if (data.recipientType === "individual") return data.customerIds && data.customerIds.length > 0;
  return false;
}, {
  message: "Seleziona i destinatari.",
  path: ["recipientType"],
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface UploadedImage {
  id: string;
  name: string;
  dataUri: string;
  placeholder: string;
}

export default function ComposeEmailPage() {
  const { categories, customers, getCustomerById, getCustomersByCategory, emailSettings, companyInfo } = useAppState();
  const { toast } = useToast();
  const [isImprovingBody, setIsImprovingBody] = useState(false);
  const [isImprovingSubject, setIsImprovingSubject] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = useState("url");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipientType: undefined,
      subject: "",
      body: "",
      customerIds: [],
    },
  });

  const recipientType = form.watch("recipientType");
  const selectedCustomerIds = form.watch("customerIds") || [];

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(
      customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  useEffect(() => {
    // Reset image dialog state when it's closed
    if (!isImageDialogOpen) {
      setImageUrl("");
      setSelectedFile(null);
      setImagePreviewUrl(null);
      setActiveImageTab("url");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isImageDialogOpen]);

  const handleToggleSelectAllFiltered = () => {
    const filteredCustomerIds = filteredCustomers.map(c => c.id);
    const allFilteredSelected = filteredCustomerIds.every(id => selectedCustomerIds.includes(id));

    if (allFilteredSelected) {
      form.setValue("customerIds", selectedCustomerIds.filter(id => !filteredCustomerIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedCustomerIds, ...filteredCustomerIds]));
      form.setValue("customerIds", newSelection);
    }
  };

  const allFilteredCustomersSelected = useMemo(() => {
    if (filteredCustomers.length === 0) return false;
    return filteredCustomers.every(c => selectedCustomerIds.includes(c.id));
  }, [filteredCustomers, selectedCustomerIds]);

  const checkAiPrerequisites = () => {
    if (!emailSettings?.googleApiKey && !process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
        toast({
          title: "Funzione AI Non ConfigURATA",
          description: "La chiave API di Google AI non è impostata nelle Impostazioni. Il miglioramento AI non è disponibile.",
          variant: "destructive",
        });
        return false;
      }
    return true;
  };

  const handleImproveBody = async () => {
    if (!checkAiPrerequisites()) return;
    const currentBody = form.getValues("body");
    
    if (!currentBody.trim()) {
      toast({ title: "Impossibile Migliorare", description: "Il corpo dell'email è vuoto.", variant: "destructive" });
      return;
    }

    setIsImprovingBody(true);
    try {
      const result = await improveEmailTextAction({ 
        text: currentBody,
        companyName: companyInfo?.companyName,
        companyDetails: companyInfo?.companyDetails,
        website: companyInfo?.website,
       });
      if (result.improvedText) {
        form.setValue("body", result.improvedText, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Corpo Email Migliorato!", description: "L'AI ha potenziato il corpo della tua email." });
      } else {
        throw new Error(result.error || "Errore sconosciuto dal servizio AI per il corpo");
      }
    } catch (error: any) {
      toast({ title: "Miglioramento Corpo Fallito", description: error.message || "Impossibile migliorare il corpo.", variant: "destructive" });
    } finally {
      setIsImprovingBody(false);
    }
  };

  const handleImproveSubject = async () => {
    if (!checkAiPrerequisites()) return;
    const currentSubject = form.getValues("subject");
    let currentBody = form.getValues("body");

    if (!currentBody.trim()) {
      toast({ title: "Contesto Mancante", description: "Scrivi prima il corpo dell'email per migliorare l'oggetto.", variant: "destructive" });
      return;
    }
    
    // Sostituisci i placeholder delle immagini con tag <img> per dare contesto all'AI per l'oggetto
    let bodyForAISubject = currentBody;
    uploadedImages.forEach(img => {
      const imgTag = `<img src="data:image/jpeg;base64,..." alt="${img.name}" style="max-width:100%;" />`; // placeholder src
      bodyForAISubject = bodyForAISubject.replace(img.placeholder, imgTag);
    });

    setIsImprovingSubject(true);
    try {
      const result = await improveEmailSubjectAction({ 
        emailBody: bodyForAISubject,
        currentSubject: currentSubject || undefined,
        companyName: companyInfo?.companyName,
        website: companyInfo?.website,
      });
      if (result.improvedSubject) {
        form.setValue("subject", result.improvedSubject, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Oggetto Email Migliorato!", description: "L'AI ha potenziato l'oggetto della tua email." });
      } else {
        throw new Error(result.error || "Errore sconosciuto dal servizio AI per l'oggetto");
      }
    } catch (error: any) {
      toast({ title: "Miglioramento Oggetto Fallito", description: error.message || "Impossibile migliorare l'oggetto.", variant: "destructive" });
    } finally {
      setIsImprovingSubject(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageUrl(""); // Clear URL if a file is selected
    }
  };

  const handleAddImage = () => {
    let imageTag = "";
    const currentBody = form.getValues("body");

    if (activeImageTab === "url" && imageUrl) {
      const altText = imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || "Immagine da URL";
      imageTag = `<img src="${imageUrl}" alt="${altText}" style="max-width:100%; height:auto; border-radius: 8px; margin-top: 10px; margin-bottom: 10px;" />`;
      form.setValue("body", currentBody + "\n" + imageTag);
      toast({ title: "Immagine da URL Aggiunta", description: "Il tag HTML per l'immagine è stato aggiunto al corpo." });
    } else if (activeImageTab === "file" && selectedFile && imagePreviewUrl) {
      const imageId = Math.random().toString(36).substring(2, 10); // Simple unique ID
      const placeholder = `[IMMAGINE_UPLOAD_${imageId.toUpperCase()}]`;
      const newUploadedImage: UploadedImage = {
        id: imageId,
        name: selectedFile.name,
        dataUri: imagePreviewUrl,
        placeholder: placeholder,
      };
      setUploadedImages(prev => [...prev, newUploadedImage]);
      form.setValue("body", currentBody + "\n" + placeholder);
      toast({ title: "Immagine Caricata e Placeholder Aggiunto", description: `Placeholder: ${placeholder}` });
    } else {
      toast({ title: "Nessuna Immagine Selezionata", description: "Inserisci un URL o carica un file.", variant: "destructive" });
      return;
    }
    
    // Reset dialog state and close
    setIsImageDialogOpen(false);
  };

  const handleRemoveUploadedImage = (imageIdToRemove: string) => {
    const imageToRemove = uploadedImages.find(img => img.id === imageIdToRemove);
    if (imageToRemove) {
      const currentBody = form.getValues("body");
      const newBody = currentBody.replace(imageToRemove.placeholder, "");
      form.setValue("body", newBody, { shouldDirty: true });
    }
    setUploadedImages(prev => prev.filter(img => img.id !== imageIdToRemove));
    toast({ title: "Immagine Caricata Rimossa", description: "L'anteprima e il placeholder sono stati rimossi." });
  };


  async function onSubmit(data: EmailFormValues) {
    setIsSending(true);
    let recipients: EmailRecipient[] = [];

    if (data.recipientType === "category" && data.categoryId) {
      const customersInCategory = getCustomersByCategory(data.categoryId);
      recipients = customersInCategory.map(c => ({ name: c.name, email: c.email }));
    } else if (data.recipientType === "individual" && data.customerIds) {
      recipients = data.customerIds.map(id => {
        const cust = getCustomerById(id);
        return cust ? { name: cust.name, email: cust.email } : null;
      }).filter(Boolean) as EmailRecipient[];
    }

    if (recipients.length === 0) {
      toast({ title: "Nessun Destinatario", description: "Seleziona destinatari validi per l'email.", variant: "destructive"});
      setIsSending(false);
      return;
    }

    if (!emailSettings?.email || !emailSettings?.appPassword) {
      toast({
        title: "Email Non Configurata",
        description: "Configura il tuo indirizzo email e la password dell'app nelle Impostazioni prima di inviare email.",
        variant: "destructive",
      });
      setIsSending(false);
      return;
    }
    
    let finalBody = data.body;
    
    if (!finalBody || finalBody.trim() === "" || finalBody.trim() === "<p><br></p>") { 
        toast({ title: "Corpo Email Vuoto", description: "Il corpo dell'email non può essere vuoto.", variant: "destructive" });
        setIsSending(false);
        return;
    }

    // Sostituisci i placeholder con i Data URI effettivi
    uploadedImages.forEach(img => {
      const imgTag = `<img src="${img.dataUri}" alt="${img.name}" style="max-width:100%; height:auto; border-radius: 8px; margin-top: 10px; margin-bottom: 10px;" />`;
      finalBody = finalBody.replace(img.placeholder, imgTag);
    });


    try {
      const result = await sendEmailAction({
        recipients,
        subject: data.subject,
        body: finalBody, // Invia come HTML
        senderEmail: emailSettings.email,
        appPassword: emailSettings.appPassword,
      });

      if (result.success) {
        toast({ title: "Email Inviata!", description: result.message });
        form.reset({ subject: "", body: "", recipientType: undefined, categoryId: undefined, customerIds: [] });
        setSearchTerm("");
        setUploadedImages([]); // Pulisci le immagini caricate dopo l'invio
      } else {
        toast({ title: "Invio Email Fallito", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Si è verificato un errore imprevisto.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  }


  const anyAiRunning = isImprovingBody || isImprovingSubject;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-primary">Componi Email</h1>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Nuova Email</CardTitle>
            <CardDescription>
              Crea il tuo messaggio e invialo ai tuoi clienti. L'AI può aiutarti a generare testo HTML strutturato.
              L'invio avverrà come HTML. I placeholder delle immagini caricate (es. `[IMMAGINE_UPLOAD_...]`) verranno sostituiti con le immagini effettive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Invia A:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("categoryId", undefined);
                            form.setValue("customerIds", []);
                            setSearchTerm("");
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1 md:flex-row md:space-x-4 md:space-y-0"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="category" />
                            </FormControl>
                            <FormLabel className="font-normal">Una Categoria</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="individual" />
                            </FormControl>
                            <FormLabel className="font-normal">Cliente/i Individuale/i</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recipientType === "category" && (
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seleziona Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Scegli una categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                             {categories.length === 0 && <SelectItem value="no-category" disabled>Nessuna categoria disponibile</SelectItem>}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {recipientType === "individual" && (
                  <FormItem className="space-y-3">
                    <FormLabel>Seleziona Cliente/i</FormLabel>
                     {customers.length === 0 ? (
                        <ShadcnFormDescription>Nessun cliente disponibile. Aggiungi prima i clienti.</ShadcnFormDescription>
                     ) : (
                       <>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                type="search"
                                placeholder="Cerca cliente per nome o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-full"
                                />
                            </div>
                            {filteredCustomers.length > 0 && (
                                <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleToggleSelectAllFiltered}
                                >
                                {allFilteredCustomersSelected ? <XSquare className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
                                {allFilteredCustomersSelected ? "Deseleziona Visibili" : "Seleziona Visibili"}
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="h-48 rounded-md border p-4">
                            {filteredCustomers.length === 0 && searchTerm && (
                                <p className="text-center text-muted-foreground py-4">Nessun cliente corrisponde alla ricerca.</p>
                            )}
                            {filteredCustomers.length === 0 && !searchTerm && (
                                 <p className="text-center text-muted-foreground py-4">Nessun cliente da visualizzare.</p>
                            )}
                            {filteredCustomers.map((customer: Customer) => (
                            <FormField
                                key={customer.id}
                                control={form.control}
                                name="customerIds"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={customer.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 py-2"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(customer.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), customer.id])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                    (value) => value !== customer.id
                                                )
                                                );
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {customer.name} ({customer.email})
                                    </FormLabel>
                                    </FormItem>
                                );
                                }}
                            />
                            ))}
                        </ScrollArea>
                       </>
                     )}
                    <FormMessage>{form.formState.errors.customerIds?.message || form.formState.errors.recipientType?.message}</FormMessage>
                  </FormItem>
                )}

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Oggetto</FormLabel>
                        <Button type="button" variant="link" size="sm" onClick={handleImproveSubject} disabled={anyAiRunning || isSending} className="text-xs p-0 h-auto text-primary hover:text-primary/80">
                          {isImprovingSubject ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                          Migliora Oggetto
                        </Button>
                      </div>
                      <FormControl>
                        <Input placeholder="Notizie entusiasmanti su..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Campo Corpo Email */}
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel htmlFor="emailBodyTextarea">Corpo Email</FormLabel>
                        <div className="flex items-center gap-2">
                           <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" size="sm" className="text-xs p-1 h-auto">
                                <ImagePlus className="mr-1 h-3 w-3" />
                                Aggiungi Immagine
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px]">
                              <DialogHeader>
                                <DialogTitle>Aggiungi Immagine al Corpo</DialogTitle>
                              </DialogHeader>
                               <Alert variant="default" className="border-yellow-500/50 text-yellow-700 dark:border-yellow-500/50 dark:text-yellow-400 [&>svg]:text-yellow-700 dark:[&>svg]:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 mb-4">
                                <Wand2 className="h-4 w-4" />
                                <AlertTitle>Funzione Sperimentale</AlertTitle>
                                <AlertDescription>
                                  L'aggiunta di immagini è sperimentale. Le immagini caricate vengono convertite in Data URI e inserite tramite placeholder.
                                </AlertDescription>
                              </Alert>
                              <Tabs value={activeImageTab} onValueChange={setActiveImageTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="url">Da URL</TabsTrigger>
                                  <TabsTrigger value="file">Carica File</TabsTrigger>
                                </TabsList>
                                <TabsContent value="url">
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="imageUrl" className="text-right">
                                        URL Img
                                      </Label>
                                      <Input
                                        id="imageUrl"
                                        value={imageUrl}
                                        onChange={(e) => { setImageUrl(e.target.value); setSelectedFile(null); setImagePreviewUrl(null);}}
                                        className="col-span-3"
                                        placeholder="https://esempio.com/immagine.png"
                                      />
                                    </div>
                                    {imageUrl && activeImageTab === "url" && (
                                        <div className="col-span-4 flex justify-center p-2 border rounded-md">
                                            <NextImage src={imageUrl} alt="Anteprima URL" width={150} height={150} style={{ objectFit: 'contain', maxHeight: '150px' }} onError={() => toast({title: "Errore URL Immagine", description: "Impossibile caricare l'anteprima dall'URL.", variant: "destructive"})} />
                                        </div>
                                    )}
                                  </div>
                                </TabsContent>
                                <TabsContent value="file">
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="imageFile" className="text-right">
                                        File
                                      </Label>
                                      <Input
                                        id="imageFile"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="col-span-3"
                                        ref={fileInputRef}
                                      />
                                    </div>
                                    {imagePreviewUrl && activeImageTab === "file" && (
                                      <div className="col-span-4 flex justify-center p-2 border rounded-md">
                                        <NextImage src={imagePreviewUrl} alt="Anteprima File" width={150} height={150} style={{ objectFit: 'contain', maxHeight: '150px' }} />
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                              <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Annulla</Button>
                                </DialogClose>
                                <Button onClick={handleAddImage}>Aggiungi Immagine</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button type="button" variant="link" size="sm" onClick={handleImproveBody} disabled={anyAiRunning || isSending} className="text-xs p-0 h-auto text-primary hover:text-primary/80">
                              {isImprovingBody ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                              Migliora Testo
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        <Textarea
                          id="emailBodyTextarea"
                          placeholder="Scrivi qui il corpo della tua email. L'AI può aiutarti a generare HTML strutturato (solo testo, senza suggerimenti di immagini). Inserisci placeholder come [IMMAGINE_UPLOAD_ID] per le immagini caricate."
                          className="min-h-[250px] bg-background"
                          {...field}
                        />
                      </FormControl>
                      <ShadcnFormDescription>
                        L'AI genererà testo HTML strutturato. Per le immagini caricate da file, verrà inserito un placeholder (es. `[IMMAGINE_UPLOAD_...]`) che sarà sostituito con l'immagine reale all'invio.
                        L'interazione tra AI e placeholder delle immagini è ancora sperimentale.
                      </ShadcnFormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Anteprima Immagini Caricate */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Anteprime Immagini Caricate:</Label>
                    <ScrollArea className="h-32 rounded-md border p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {uploadedImages.map((img) => (
                          <Card key={img.id} className="p-2 shadow-sm">
                            <div className="flex flex-col items-center gap-1 text-xs text-center">
                                <NextImage src={img.dataUri} alt={img.name} width={60} height={60} style={{ objectFit: 'contain', maxHeight: '60px', borderRadius: '4px' }} />
                                <span className="truncate w-full" title={img.name}>{img.name}</span>
                                <code className="text-muted-foreground bg-muted px-1 rounded text-[10px]">{img.placeholder}</code>
                                <Button type="button" variant="destructive" size="icon" className="h-5 w-5 mt-1" onClick={() => handleRemoveUploadedImage(img.id)}>
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">Rimuovi {img.name}</span>
                                </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
                  <Button type="submit" variant="default" disabled={isSending || anyAiRunning} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Invia Email
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

