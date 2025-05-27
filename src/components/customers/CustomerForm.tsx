"use client";

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
  const { addCustomer, updateCustomer, categories } = useAppState();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      categoryIds: customer?.categoryIds || [],
    },
  });

  function onSubmit(data: CustomerFormValues) {
    try {
      if (customer) {
        updateCustomer({ ...customer, ...data, categoryIds: data.categoryIds || [] });
        toast({ title: "Cliente Aggiornato", description: `${data.name} è stato aggiornato con successo.` });
      } else {
        addCustomer({ name: data.name, email: data.email, categoryIds: data.categoryIds || [] });
        toast({ title: "Cliente Aggiunto", description: `${data.name} è stato aggiunto con successo.` });
      }
      form.reset();
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
        
        {categories.length > 0 && (
          <FormItem>
            <FormLabel>Categorie</FormLabel>
            <ScrollArea className="h-40 rounded-md border p-4">
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
            <FormMessage />
          </FormItem>
        )}

        <Button type="submit" className="w-full" variant="default">
          {customer ? "Aggiorna Cliente" : "Aggiungi Cliente"}
        </Button>
      </form>
    </Form>
  );
}
