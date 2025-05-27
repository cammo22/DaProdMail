
"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Mail, Users, FolderKanban, Settings, LayoutDashboard, Send, LogOut, Building, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  tooltip: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/customers', label: 'Clienti', icon: Users, tooltip: 'Gestisci Clienti' },
  { href: '/categories', label: 'Categorie', icon: FolderKanban, tooltip: 'Gestisci Categorie' },
  { href: '/compose', label: 'Componi Email', icon: Send, tooltip: 'Componi e Invia Email' },
  { href: '/info-ai-azienda', label: 'Info AI Azienda', icon: Building, tooltip: 'Info Azienda per AI' },
  { href: '/settings', label: 'Impostazioni', icon: Settings, tooltip: 'Impostazioni Applicazione' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left">
        <SidebarHeader className="items-center">
          <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
            <Button variant="ghost" size="icon" className="rounded-lg" asChild>
              <Link href="/">
                <Mail className="text-sidebar-primary" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              DaProdMail
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.tooltip, className: "ml-2" }}
                    className="justify-start"
                  >
                    <item.icon />
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <Separator className="my-2 bg-sidebar-border group-data-[collapsible=icon]:hidden" />
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                  <AvatarFallback>DP</AvatarFallback>
                </Avatar>
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Profilo Utente</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel>Il Mio Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Impostazioni</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Esci</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shadow-sm">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Breadcrumbs or current page title can go here */}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    