
'use server';

/**
 * @fileOverview Flussi AI per migliorare il testo e l'oggetto delle email.
 *
 * - improveEmailText - Migliora il testo del corpo dell'email per scopi di marketing.
 * - ImproveEmailTextInput - Input per improveEmailText.
 * - ImproveEmailTextOutput - Output per improveEmailText.
 * - improveEmailSubject - Suggerisce o migliora l'oggetto dell'email per marketing.
 * - ImproveEmailSubjectInput - Input per improveEmailSubject.
 * - ImproveEmailSubjectOutput - Output per improveEmailSubject.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Miglioramento Corpo Email ---
const ImproveEmailTextInputSchema = z.object({
  text: z.string().describe('Il testo di base o le poche parole chiave iniziali per il corpo dell\'email.'),
  companyName: z.string().optional().describe("Il nome dell'azienda per cui si sta scrivendo l'email."),
  companyDetails: z.string().optional().describe("Dettagli sull'azienda, i suoi prodotti/servizi, il target, i punti di forza."),
  website: z.string().optional().describe("Il sito web dell'azienda, se rilevante per il contesto."),
});
export type ImproveEmailTextInput = z.infer<typeof ImproveEmailTextInputSchema>;

const ImproveEmailTextOutputSchema = z.object({
  improvedText: z.string().describe('Il testo del corpo dell\'email espanso e migliorato in formato HTML per marketing, solo testo, senza immagini o placeholder per immagini.'),
});
export type ImproveEmailTextOutput = z.infer<typeof ImproveEmailTextOutputSchema>;

export async function improveEmailText(input: ImproveEmailTextInput): Promise<ImproveEmailTextOutput> {
  return improveEmailTextFlow(input);
}

const improveEmailTextPrompt = ai.definePrompt({
  name: 'improveEmailTextPrompt',
  input: {schema: ImproveEmailTextInputSchema},
  output: {schema: ImproveEmailTextOutputSchema},
  prompt: `Dato il seguente testo di base o poche parole chiave per un'email di marketing:
"{{{text}}}"

{{#if companyName}}
L'email è per l'azienda: "{{{companyName}}}".
{{/if}}
{{#if companyDetails}}
Informazioni sull'azienda: "{{{companyDetails}}}".
{{/if}}
{{#if website}}
Il sito web dell'azienda è: "{{{website}}}". Consideralo se utile per il contesto.
{{/if}}

Il tono dell'email deve essere formale ma amichevole. Usa un massimo di 1-2 emoji appropriate se strettamente pertinenti al contesto, altrimenti non usarle.

Espandi questo input in un testo di marketing HTML ben strutturato e coinvolgente.
L'obiettivo è creare un messaggio persuasivo che metta in evidenza i benefici per il cliente.
Utilizza titoli (es. <h2>Titolo Principale</h2>) e sottotitoli (es. <h3>Sottotitolo</h3>, <h4>Altro Sottotitolo</h4>) per organizzare il contenuto.
Crea paragrafi chiari (<p>...</p>) e usa elenchi puntati (<ul><li>...</li></ul>) o numerati (<ol><li>...</li></ol>) se appropriato.
Includi strong (<b>...</b> o <strong>...</strong>) per enfatizzare punti chiave.

NON SUGGERIRE IMMAGINI. NON INCLUDERE PLACEHOLDER PER IMMAGINI come "[SUGGERIMENTO_IMMAGINE: ...]". Il risultato deve essere esclusivamente testo HTML.

Assicurati che il messaggio sia chiaro e trasmetta il valore principale.
Restituisci solo il codice HTML del corpo dell'email migliorato. Non includere tag <html>, <head>, o <body>.
`,
});

const improveEmailTextFlow = ai.defineFlow(
  {
    name: 'improveEmailTextFlow',
    inputSchema: ImproveEmailTextInputSchema,
    outputSchema: ImproveEmailTextOutputSchema,
  },
  async input => {
    const {output} = await improveEmailTextPrompt(input);
    return output!;
  }
);

// --- Miglioramento Oggetto Email ---
const ImproveEmailSubjectInputSchema = z.object({
  emailBody: z.string().describe("Il corpo dell'email (testo HTML o semplice) per cui generare o migliorare l'oggetto."),
  currentSubject: z.string().optional().describe("L'eventuale oggetto attuale dell'email da migliorare. Se vuoto, generarne uno nuovo."),
  companyName: z.string().optional().describe("Il nome dell'azienda per cui si sta scrivendo l'email."),
  website: z.string().optional().describe("Il sito web dell'azienda, se rilevante per il contesto dell'oggetto."),
});
export type ImproveEmailSubjectInput = z.infer<typeof ImproveEmailSubjectInputSchema>;

const ImproveEmailSubjectOutputSchema = z.object({
  improvedSubject: z.string().describe("L'oggetto dell'email migliorato o generato per massimizzare l'impatto e il tasso di apertura."),
});
export type ImproveEmailSubjectOutput = z.infer<typeof ImproveEmailSubjectOutputSchema>;

export async function improveEmailSubject(input: ImproveEmailSubjectInput): Promise<ImproveEmailSubjectOutput> {
  return improveEmailSubjectFlow(input);
}

const improveEmailSubjectPrompt = ai.definePrompt({
  name: 'improveEmailSubjectPrompt',
  input: {schema: ImproveEmailSubjectInputSchema},
  output: {schema: ImproveEmailSubjectOutputSchema},
  prompt: `Considera il seguente corpo dell'email (testo HTML o semplice):
<corpo_email>
{{{emailBody}}}
</corpo_email>

{{#if companyName}}
L'email è per l'azienda: "{{{companyName}}}".
{{/if}}
{{#if website}}
Il sito web dell'azienda è: "{{{website}}}".
{{/if}}

Il tono dell'oggetto deve essere formale ma amichevole. Evita emoji nell'oggetto.

{{#if currentSubject}}
L'oggetto attuale è: "{{{currentSubject}}}"
Migliora questo oggetto per renderlo più accattivante, conciso e ottimizzato per il marketing, al fine di massimizzare il tasso di apertura.
{{else}}
Genera un oggetto email di marketing accattivante e conciso per il corpo dell'email fornito. L'oggetto deve suscitare curiosità, comunicare chiaramente il valore principale dell'email e incoraggiare l'apertura.
{{/if}}

L'oggetto deve essere breve, incisivo e focalizzato sul beneficio per il destinatario. Evita un linguaggio troppo generico o fuorviante.
Restituisci solo l'oggetto dell'email migliorato o generato.`,
});

const improveEmailSubjectFlow = ai.defineFlow(
  {
    name: 'improveEmailSubjectFlow',
    inputSchema: ImproveEmailSubjectInputSchema,
    outputSchema: ImproveEmailSubjectOutputSchema,
  },
  async input => {
    const {output} = await improveEmailSubjectPrompt(input);
    return output!;
  }
);

