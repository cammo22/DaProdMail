
"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/contexts/AppStateContext';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Send, Loader2, Sparkles, Search, CheckSquare, XSquare } from 'lucide-react';
import { improveEmailTextAction, improveEmailSubjectAction, sendEmailAction, type EmailRecipient } from './actions';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Customer } from '@/types';


const emailFormSchema = z.object({
  recipientType: z.enum(["category", "individual"], { required_error: "Seleziona un tipo di destinatario." }),
  categoryId: z.string().optional(),
  customerIds: z.array(z.string()).optional(),
  subject: z.string().min(1, { message: "L'oggetto non può essere vuoto." }),
  body: z.string().min(1, { message: "Il corpo dell'email non può essere vuoto (bastano poche parole per l'AI)." }),
}).refine(data => {
  if (data.recipientType === "category") return !!data.categoryId;
  if (data.recipientType === "individual") return data.customerIds && data.customerIds.length > 0;
  return false;
}, {
  message: "Seleziona i destinatari.",
  path: ["recipientType"], // path updated to cover both category and individual
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

export default function ComposeEmailPage() {
  const { categories, customers, getCustomerById, getCustomersByCategory, emailSettings } = useAppState();
  const { toast } = useToast();
  const [isImprovingBody, setIsImprovingBody] = useState(false);
  const [isImprovingSubject, setIsImprovingSubject] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleToggleSelectAllFiltered = () => {
    const filteredCustomerIds = filteredCustomers.map(c => c.id);
    const allFilteredSelected = filteredCustomerIds.every(id => selectedCustomerIds.includes(id));

    if (allFilteredSelected) {
      // Deselect all filtered
      form.setValue("customerIds", selectedCustomerIds.filter(id => !filteredCustomerIds.includes(id)));
    } else {
      // Select all filtered (add to existing selection without duplication)
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
  }

  const handleImproveBody = async () => {
    if (!checkAiPrerequisites()) return;
    const currentBody = form.getValues("body");
    if (!currentBody) {
      toast({ title: "Impossibile Migliorare", description: "Il corpo dell'email è vuoto.", variant: "destructive" });
      return;
    }
    
    setIsImprovingBody(true);
    try {
      const result = await improveEmailTextAction({ text: currentBody });
      if (result.improvedText) {
        form.setValue("body", result.improvedText);
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
    const currentBody = form.getValues("body");

    if (!currentBody) {
      toast({ title: "Contesto Mancante", description: "Scrivi prima il corpo dell'email per migliorare l'oggetto.", variant: "destructive" });
      return;
    }

    setIsImprovingSubject(true);
    try {
      const result = await improveEmailSubjectAction({ emailBody: currentBody, currentSubject: currentSubject || undefined });
      if (result.improvedSubject) {
        form.setValue("subject", result.improvedSubject);
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

    try {
      const result = await sendEmailAction({
        recipients,
        subject: data.subject,
        body: data.body,
        senderEmail: emailSettings.email,
        appPassword: emailSettings.appPassword,
      });

      if (result.success) {
        toast({ title: "Email Inviata!", description: result.message });
        form.reset({ subject: "", body: "", recipientType: undefined, categoryId: undefined, customerIds: [] });
        setSearchTerm("");
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
            <CardDescription>Crea il tuo messaggio e invialo ai tuoi clienti. Usa l'AI per potenziare testi e oggetti!</CardDescription>
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
                        <FormDescription>Nessun cliente disponibile. Aggiungi prima i clienti.</FormDescription>
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
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex justify-between items-center">
                        <FormLabel>Corpo Email</FormLabel>
                        <Button type="button" variant="link" size="sm" onClick={handleImproveBody} disabled={anyAiRunning || isSending} className="text-xs p-0 h-auto text-primary hover:text-primary/80">
                          {isImprovingBody ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                          Migliora Testo
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Scrivi poche parole chiave o il testo base... l'AI lo espanderà!" rows={10} {...field} />
                      </FormControl>
                      <FormDescription>
                        Puoi scrivere solo poche parole chiave e l'AI cercherà di espanderle in un testo di marketing completo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

