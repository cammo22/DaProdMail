
"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit3, Trash2, UploadCloud, Download, FolderKanban, AlertTriangle } from 'lucide-react';
import { useAppState } from '@/contexts/AppStateContext';
import { CustomerForm } from '@/components/customers/CustomerForm';
import type { Customer, Category } from '@/types';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function CustomersPage() {
  const { customers, deleteCustomer, deleteAllCustomers, getCategoryById, importCustomers, categories, updateCustomer } = useAppState();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleteAllCustomersDialogOpen, setIsDeleteAllCustomersDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerForCategoryAssignment, setCustomerForCategoryAssignment] = useState<Customer | null>(null);
  const [isCategoryAssignmentDialogOpen, setIsCategoryAssignmentDialogOpen] = useState(false);
  const [tempSelectedCategoryIds, setTempSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    if (customerForCategoryAssignment) {
      setTempSelectedCategoryIds(customerForCategoryAssignment.categoryIds || []);
    }
  }, [customerForCategoryAssignment]);

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      toast({ title: "Cliente Eliminato", description: `${customerToDelete.name} è stato eliminato.` });
      setCustomerToDelete(null);
    }
  };

  const handleDeleteAllCustomersConfirm = () => {
    deleteAllCustomers();
    toast({ title: "Clienti Eliminati", description: "Tutti i clienti sono stati eliminati." });
    setIsDeleteAllCustomersDialogOpen(false);
  };

  const handleExportCustomers = () => {
    if (customers.length === 0) {
      toast({ title: "Nessun Cliente", description: "Non ci sono clienti da esportare.", variant: "destructive" });
      return;
    }
    const fileContent = customers
      .map(customer => `${customer.name},${customer.email},${(customer.categoryIds || []).join(';')}`)
      .join('\n');
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clienti.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione Riuscita", description: "La lista clienti è stata esportata in clienti.txt." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "Nessun File Selezionato", description: "Per favore seleziona un file TXT.", variant: "destructive" });
      return;
    }

    if (file.type !== "text/plain") {
        toast({ title: "Formato File Errato", description: "Per favore seleziona un file con estensione .txt.", variant: "destructive" });
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset input
        }
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({ title: "File Vuoto", description: "Il file selezionato è vuoto o illeggibile.", variant: "destructive" });
        return;
      }
      try {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const newCustomers: Array<Omit<Customer, 'id' | 'categoryIds'> & { categoryIds?: string[] }> = [];
        let importedCount = 0;
        let skippedCount = 0;

        lines.forEach((line, index) => {
          const parts = line.split(',');
          if (parts.length >= 2) { // Must have at least name and email
            const name = parts[0].trim();
            const email = parts[1].trim();
            let categoryIds: string[] = [];

            if (parts.length > 2 && parts[2].trim() !== '') {
              const rawCategoryIds = parts[2].trim().split(';').map(id => id.trim()).filter(id => id !== '');
              // Filter to keep only existing category IDs
              categoryIds = rawCategoryIds.filter(id => getCategoryById(id));
              if (rawCategoryIds.length !== categoryIds.length) {
                console.warn(`Riga ${index + 1}: Alcuni ID categoria non validi sono stati ignorati per il cliente ${name}.`);
              }
            }
            
            if (name && email) { // Basic validation for name and email
              newCustomers.push({ name, email, categoryIds });
              importedCount++;
            } else {
              console.warn(`Riga ${index + 1} ignorata: nome o email mancanti o non validi.`);
              skippedCount++;
            }
          } else {
            console.warn(`Riga ${index + 1} ignorata: formato non corretto (richiesti almeno nome,email).`);
            skippedCount++;
          }
        });

        if (newCustomers.length > 0) {
          importCustomers(newCustomers);
          toast({ 
            title: "Importazione Completata", 
            description: `${importedCount} cliente/i importato/i con successo. ${skippedCount > 0 ? `${skippedCount} riga/e ignorata/e (controlla la console per dettagli).` : ''}` 
          });
        } else {
          toast({ title: "Nessun Cliente Importato", description: `Nessun cliente valido trovato nel file. ${skippedCount > 0 ? `${skippedCount} riga/e ignorata/e.` : ''}`, variant: "destructive" });
        }
      } catch (error) {
        console.error("Errore durante l'importazione:", error);
        toast({ title: "Errore di Importazione", description: "Si è verificato un errore durante la lettura del file.", variant: "destructive" });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.onerror = () => {
        toast({ title: "Errore Lettura File", description: "Impossibile leggere il file selezionato.", variant: "destructive"});
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
    reader.readAsText(file);
  };

  const handleOpenCategoryAssignmentDialog = (customer: Customer) => {
    setCustomerForCategoryAssignment(customer);
    // useEffect will set tempSelectedCategoryIds
    setIsCategoryAssignmentDialogOpen(true);
  };

  const handleCategorySelectionChange = (categoryId: string, checked: boolean) => {
    setTempSelectedCategoryIds(prev =>
      checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
    );
  };

  const handleSaveCategoryAssignment = () => {
    if (customerForCategoryAssignment) {
      updateCustomer({ ...customerForCategoryAssignment, categoryIds: tempSelectedCategoryIds });
      toast({ title: "Categorie Aggiornate", description: `Le categorie per ${customerForCategoryAssignment.name} sono state aggiornate.` });
      setIsCategoryAssignmentDialogOpen(false);
      setCustomerForCategoryAssignment(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <h1 className="text-3xl font-bold text-primary">Gestisci Clienti</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleImportClick}>
            <UploadCloud className="mr-2 h-4 w-4" /> Importa Clienti (TXT)
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".txt"
            style={{ display: 'none' }}
          />
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download className="mr-2 h-4 w-4" /> Esporta Clienti (TXT)
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuovo Cliente</DialogTitle>
                <DialogDescription>
                  Compila i dettagli per il nuovo cliente.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {customers.length > 0 && (
         <div className="mb-6">
            <Separator />
            <div className="flex justify-end pt-4">
                <Button variant="destructive" onClick={() => setIsDeleteAllCustomersDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Elimina Tutti i Clienti
                </Button>
            </div>
         </div>
      )}


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Elenco Clienti</CardTitle>
          <CardDescription>Visualizza e gestisci tutti i tuoi clienti.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nessun cliente ancora. Aggiungi il tuo primo cliente o importa una lista!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(customer.categoryIds || []).map(catId => {
                          const category = getCategoryById(catId);
                          return category ? <Badge key={catId} variant="secondary">{category.name}</Badge> : null;
                        })}
                        {(customer.categoryIds || []).length === 0 && <span className="text-xs text-muted-foreground">N/D</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Apri menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(customer)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Modifica Cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenCategoryAssignmentDialog(customer)}>
                            <FolderKanban className="mr-2 h-4 w-4" /> Assegna Categorie
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCustomerToDelete(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Elimina Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifica Cliente</DialogTitle>
            <DialogDescription>
              Aggiorna i dettagli del cliente.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setEditingCustomer(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Categories Dialog */}
      <Dialog open={isCategoryAssignmentDialogOpen} onOpenChange={setIsCategoryAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assegna Categorie a {customerForCategoryAssignment?.name}</DialogTitle>
            <DialogDescription>
              Seleziona le categorie a cui vuoi assegnare questo cliente.
            </DialogDescription>
          </DialogHeader>
          {categories.length > 0 ? (
            <ScrollArea className="h-60 rounded-md border p-4 my-4">
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-assign-${category.id}`}
                      checked={tempSelectedCategoryIds.includes(category.id)}
                      onCheckedChange={(checked) => handleCategorySelectionChange(category.id, !!checked)}
                    />
                    <Label htmlFor={`cat-assign-${category.id}`} className="font-normal">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-sm my-4">
              Nessuna categoria disponibile. <Link href="/categories" className="text-primary hover:underline">Crea prima una categoria.</Link>
            </p>
          )}
          <DialogFooter className="sm:justify-end gap-2">
            <DialogClose asChild>
                <Button type="button" variant="outline">
                Annulla
                </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveCategoryAssignment} disabled={categories.length === 0 && tempSelectedCategoryIds.length === 0}>
              Salva Categorie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Delete Single Customer Confirmation Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
             Quest'azione non può essere annullata. Eliminerà permanentemente il cliente "{customerToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Customers Confirmation Dialog */}
      <AlertDialog open={isDeleteAllCustomersDialogOpen} onOpenChange={setIsDeleteAllCustomersDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center text-destructive mb-2">
                <AlertTriangle className="mr-2 h-6 w-6 " />
                <AlertDialogTitle className="text-destructive">ATTENZIONE: Sei sicuro?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
             Stai per eliminare **tutti i clienti** dalla lista. Questa azione è irreversibile e non potrà essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAllCustomersDialogOpen(false)}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllCustomersConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sì, Elimina Tutti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AppLayout>
  );
}

