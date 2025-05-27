
# DaProdMail - Soluzione Email per Clienti con AI

DaProdMail è un'applicazione web costruita con Next.js che ti permette di gestire i tuoi clienti, organizzarli in categorie e inviare email personalizzate, con l'aggiunta di funzionalità AI per migliorare i tuoi testi di marketing.

## Funzionalità Principali

*   **Gestione Clienti:**
    *   Aggiungi, modifica ed elimina clienti.
    *   Importa ed esporta la lista clienti tramite file `.txt` (formato: `Nome,email`).
    *   Assegna clienti a una o più categorie.
*   **Gestione Categorie:**
    *   Crea, modifica ed elimina categorie per raggruppare i clienti.
*   **Composizione Email Potenziata da AI:**
    *   Scrivi email e inviale a singoli clienti o a intere categorie.
    *   Utilizza l'intelligenza artificiale (tramite Genkit e Google AI) per:
        *   **Migliorare il corpo dell'email:** Espandi poche parole chiave in un testo di marketing completo e coinvolgente.
        *   **Migliorare l'oggetto dell'email:** Genera o raffina oggetti per massimizzare l'impatto e il tasso di apertura, basandosi sul corpo dell'email.
*   **Configurazione Semplice:**
    *   Imposta il tuo indirizzo Gmail e una "Password per app" per l'invio effettivo delle email.
    *   Configura la tua chiave API di Google AI per abilitare le funzionalità di miglioramento del testo.
*   **Interfaccia Utente Moderna:**
    *   Realizzata con ShadCN UI e Tailwind CSS per un'esperienza utente pulita e reattiva.
    *   Navigazione intuitiva con sidebar.

## Stack Tecnologico

*   **Framework Frontend:** [Next.js](https://nextjs.org/) (con App Router)
*   **Libreria UI:** [React](https://react.dev/)
*   **Linguaggio:** [TypeScript](https://www.typescriptlang.org/)
*   **Componenti UI:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Funzionalità AI:** [Genkit](https://firebase.google.com/docs/genkit) (con il provider Google AI)
*   **Invio Email:** [Nodemailer](https://nodemailer.com/) (configurato per Gmail con Password per app)
*   **Validazione Schemi:** [Zod](https://zod.dev/)
*   **Icone:** [Lucide React](https://lucide.dev/)
*   **Gestione Stato Locale:** React Context API con `localStorage` per la persistenza.

## Per Iniziare

1.  **Clona il repository (se applicabile) o apri il progetto in Firebase Studio.**
2.  **Installa le dipendenze:**
    ```bash
    npm install
    # o
    yarn install
    # o
    pnpm install
    ```
3.  **Configura le impostazioni dell'applicazione:**
    *   Naviga alla pagina "Impostazioni" nell'applicazione.
    *   Inserisci il tuo indirizzo **Email Google Mail** e la relativa **Password per App**. Puoi generare una Password per App [qui](https://myaccount.google.com/apppasswords).
    *   Inserisci la tua **Chiave API Google AI**. Puoi ottenerla da [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   *Nota: Le funzionalità AI (miglioramento testo/oggetto) richiederanno una chiave API Google AI valida. L'invio email richiederà un indirizzo Gmail e una Password per App validi.*
4.  **Avvia l'applicazione in modalità sviluppo:**
    ```bash
    npm run dev
    ```
    L'applicazione sarà disponibile su `http://localhost:9002` (o la porta specificata).
5.  **Avvia Genkit per le funzionalità AI (in un terminale separato):**
    ```bash
    npm run genkit:dev
    ```

## Script Disponibili

Nel `package.json`, troverai i seguenti script:

*   `npm run dev`: Avvia l'applicazione Next.js in modalità sviluppo con Turbopack.
*   `npm run genkit:dev`: Avvia il server Genkit in modalità sviluppo per le funzionalità AI.
*   `npm run genkit:watch`: Avvia il server Genkit in modalità sviluppo con hot-reloading per i file AI.
*   `npm run build`: Compila l'applicazione Next.js per la produzione.
*   `npm run start`: Avvia un server di produzione Next.js.
*   `npm run lint`: Esegue ESLint per l'analisi statica del codice.
*   `npm run typecheck`: Esegue il controllo dei tipi TypeScript.

## Struttura del Progetto (Sommario)

*   `src/app/`: Contiene le pagine dell'applicazione (routing basato su App Router).
*   `src/components/`: Contiene i componenti React riutilizzabili, inclusi i componenti UI di ShadCN.
*   `src/ai/`: Contiene la logica relativa all'intelligenza artificiale (flussi Genkit).
*   `src/contexts/`: Contiene i provider di contesto React (es. `AppStateContext`).
*   `src/hooks/`: Contiene custom hooks React.
*   `src/lib/`: Contiene utility e funzioni di supporto.
*   `src/types/`: Contiene le definizioni dei tipi TypeScript.

Sperimenta con DaProdMail e rendi le tue campagne email più efficaci!
