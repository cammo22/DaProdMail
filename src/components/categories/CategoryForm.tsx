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
import type { Category } from "@/types";
import { useToast } from "@/hooks/use-toast";

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Il nome della categoria deve contenere almeno 2 caratteri." }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category | null;
  onSuccess?: () => void;
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { addCategory, updateCategory } = useAppState();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
    },
  });

  function onSubmit(data: CategoryFormValues) {
    try {
      if (category) {
        updateCategory({ ...category, name: data.name });
        toast({ title: "Categoria Aggiornata", description: `La categoria "${data.name}" è stata aggiornata.` });
      } else {
        addCategory({ name: data.name });
        toast({ title: "Categoria Aggiunta", description: `La categoria "${data.name}" è stata aggiunta.` });
      }
      form.reset({ name: '' }); // Reset with empty name for add mode
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
              <FormLabel>Nome Categoria</FormLabel>
              <FormControl>
                <Input placeholder="es., Clienti VIP, Potenziali Clienti" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" variant="default">
          {category ? "Aggiorna Categoria" : "Aggiungi Categoria"}
        </Button>
      </form>
    </Form>
  );
}
