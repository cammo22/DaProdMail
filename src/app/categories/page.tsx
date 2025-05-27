"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Edit3, Trash2, Users } from 'lucide-react';
import { useAppState } from '@/contexts/AppStateContext';
import { CategoryForm } from '@/components/categories/CategoryForm';
import type { Category } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

export default function CategoriesPage() {
  const { categories, deleteCategory, getCustomersByCategory } = useAppState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      toast({ title: "Categoria Eliminata", description: `La categoria "${categoryToDelete.name}" è stata eliminata.` });
      setCategoryToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Gestisci Categorie</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuova Categoria</DialogTitle>
              <DialogDescription>
                Inserisci il nome per la nuova categoria.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm onSuccess={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
         <Card className="shadow-lg text-center">
            <CardHeader>
              <CardTitle>Nessuna Categoria Ancora</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground py-8">
                Inizia a organizzare i tuoi clienti aggiungendo categorie.
              </p>
            </CardContent>
          </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const customersInCat = getCustomersByCategory(category.id);
            return (
              <Card key={category.id} className="shadow-lg flex flex-col">
                <CardHeader>
                  <CardTitle className="text-primary">{category.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Users className="mr-2 h-4 w-4" /> {customersInCat.length} cliente/i
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  {/* Can add more details or a brief list of customers here if needed */}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    <Edit3 className="mr-2 h-4 w-4" /> Modifica
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Elimina
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Categoria</DialogTitle>
            <DialogDescription>
              Aggiorna il nome della categoria.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingCategory(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Quest'azione non può essere annullata. Eliminerà permanentemente la categoria "{categoryToDelete?.name}" e la rimuoverà da tutti i clienti associati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
