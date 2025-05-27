
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
  text: z.string().describe('Il testo di base o le poche parole iniziali per il corpo dell\'email.'),
});
export type ImproveEmailTextInput = z.infer<typeof ImproveEmailTextInputSchema>;

const ImproveEmailTextOutputSchema = z.object({
  improvedText: z.string().describe('Il testo del corpo dell\'email espanso e migliorato per marketing.'),
});
export type ImproveEmailTextOutput = z.infer<typeof ImproveEmailTextOutputSchema>;

export async function improveEmailText(input: ImproveEmailTextInput): Promise<ImproveEmailTextOutput> {
  return improveEmailTextFlow(input);
}

const improveEmailTextPrompt = ai.definePrompt({
  name: 'improveEmailTextPrompt',
  input: {schema: ImproveEmailTextInputSchema},
  output: {schema: ImproveEmailTextOutputSchema},
  prompt: `Dato il seguente testo di base per un'email (potrebbero essere anche solo poche parole chiave), espandilo e miglioralo per renderlo più conciso, professionale e coinvolgente. Evita frasi standard o troppo generiche, ma assicurati che il messaggio rimanga chiaro e trasmetta il valore principale. L'output dovrebbe essere un testo pronto per essere inviato, non troppo lungo.

Testo di base da cui partire:
{{{text}}}

Restituisci solo il corpo dell'email migliorato.`,
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
  emailBody: z.string().describe("Il corpo dell'email per cui generare o migliorare l'oggetto."),
  currentSubject: z.string().optional().describe("L'eventuale oggetto attuale dell'email da migliorare. Se vuoto, generarne uno nuovo."),
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
  prompt: `Considera il seguente corpo dell'email:
<corpo_email>
{{{emailBody}}}
</corpo_email>

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
