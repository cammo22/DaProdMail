
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/contexts/AppStateContext";
import type { Customer, Category } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";

const customerFormSchema = z.object({
  name: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri." }),
  email: z.string().email({ message: "Indirizzo email non valido." }),
  categoryIds: z.array(z.string()).optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: Customer | null;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { addCustomer, updateCustomer, categories, addCategory } = useAppState();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      categoryIds: customer?.categoryIds || [],
    },
  });

  const handleCreateAndAssignCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast({ title: "Nome Categoria Vuoto", description: "Inserisci un nome per la nuova categoria.", variant: "destructive" });
      return;
    }
    if (categories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ title: "Categoria Esistente", description: `Una categoria con nome "${trimmedName}" esiste già.`, variant: "destructive" });
      return;
    }

    try {
      const createdCategory = addCategory({ name: trimmedName });
      if (createdCategory) {
        const currentCategoryIds = form.getValues("categoryIds") || [];
        form.setValue("categoryIds", [...currentCategoryIds, createdCategory.id], { shouldValidate: true, shouldDirty: true });
        toast({ title: "Categoria Creata e Assegnata", description: `Categoria "${createdCategory.name}" creata e assegnata.` });
        setNewCategoryName(""); // Reset input
      }
    } catch (error) {
      toast({ title: "Errore Creazione Categoria", description: "Impossibile creare la categoria.", variant: "destructive" });
      console.error("Failed to create category from customer form:", error);
    }
  };

  function onSubmit(data: CustomerFormValues) {
    try {
      if (customer) {
        updateCustomer({ ...customer, ...data, categoryIds: data.categoryIds || [] });
        toast({ title: "Cliente Aggiornato", description: `${data.name} è stato aggiornato con successo.` });
      } else {
        addCustomer({ name: data.name, email: data.email, categoryIds: data.categoryIds || [] });
        toast({ title: "Cliente Aggiunto", description: `${data.name} è stato aggiunto con successo.` });
      }
      form.reset({name: "", email: "", categoryIds: []}); // Explicitly reset fields
      setNewCategoryName("");
      onSuccess?.();
    } catch (error) {
      toast({ title: "Errore", description: "Qualcosa è andato storto. Per favore riprova.", variant: "destructive" });
      console.error(error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Mario Rossi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="mario.rossi@esempio.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
            <FormLabel>Assegna a Categorie Esistenti</FormLabel>
            {categories.length > 0 ? (
                <ScrollArea className="h-32 rounded-md border p-4">
                {categories.map((category: Category) => (
                    <FormField
                    key={category.id}
                    control={form.control}
                    name="categoryIds"
                    render={({ field }) => {
                        return (
                        <FormItem
                            key={category.id}
                            className="flex flex-row items-start space-x-3 space-y-0 py-2"
                        >
                            <FormControl>
                            <Checkbox
                                checked={field.value?.includes(category.id)}
                                onCheckedChange={(checked) => {
                                return checked
                                    ? field.onChange([...(field.value || []), category.id])
                                    : field.onChange(
                                        (field.value || []).filter(
                                        (value) => value !== category.id
                                        )
                                    );
                                }}
                            />
                            </FormControl>
                            <FormLabel className="font-normal">
                            {category.name}
                            </FormLabel>
                        </FormItem>
                        );
                    }}
                    />
                ))}
                </ScrollArea>
            ) : (
                <p className="text-xs text-muted-foreground pt-1">
                    Nessuna categoria esistente. Creane una qui sotto o dalla pagina Categorie.
                </p>
            )}
             <FormMessage /> {/* For categoryIds field errors, if any */}
        </FormItem>

        <Separator className="my-4" />

        <div className="space-y-2">
            <FormLabel>Oppure, Crea e Assegna Nuova Categoria</FormLabel>
            <div className="flex gap-2 items-center">
                <Input
                placeholder="Nome nuova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={handleCreateAndAssignCategory} disabled={!newCategoryName.trim()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crea e Assegna
                </Button>
            </div>
        </div>

        <Button type="submit" className="w-full" variant="default">
          {customer ? "Aggiorna Cliente" : "Aggiungi Cliente"}
        </Button>
      </form>
    </Form>
  );
}

