
"use server";

import { 
  improveEmailText as genAiImproveEmailText,
  improveEmailSubject as genAiImproveEmailSubject,
  type ImproveEmailTextInput as GenAiImproveEmailTextInput,
  type ImproveEmailSubjectInput as GenAiImproveEmailSubjectInput
} from '@/ai/flows/improve-email-text';
import nodemailer from 'nodemailer';
import type { CompanyInfo } from '@/types';


export interface EmailRecipient {
  name: string;
  email: string;
}
export interface SendEmailParams {
  recipients: EmailRecipient[];
  subject: string;
  body: string; // Sarà HTML
  senderEmail?: string; 
  appPassword?: string; 
}

// Rimuovere toneOfVoice da questi tipi se non più usato
export interface ImproveEmailTextInput extends Omit<GenAiImproveEmailTextInput, 'toneOfVoice'>, Partial<Pick<CompanyInfo, 'companyName' | 'companyDetails' | 'website'>> {}
export interface ImproveEmailSubjectInput extends Omit<GenAiImproveEmailSubjectInput, 'toneOfVoice'>, Partial<Pick<CompanyInfo, 'companyName' | 'website'>> {}


export async function improveEmailTextAction(input: ImproveEmailTextInput): Promise<{ improvedText?: string; error?: string }> {
  try {
    const result = await genAiImproveEmailText(input);
    return { improvedText: result.improvedText };
  } catch (error) {
    console.error("Errore nel migliorare il testo del corpo dell'email:", error);
    return { error: "Impossibile migliorare il testo del corpo dell'email. Controlla i log del server per i dettagli." };
  }
}

export async function improveEmailSubjectAction(input: ImproveEmailSubjectInput): Promise<{ improvedSubject?: string; error?: string }> {
  try {
    const result = await genAiImproveEmailSubject(input);
    return { improvedSubject: result.improvedSubject };
  } catch (error) {
    console.error("Errore nel migliorare l'oggetto dell'email:", error);
    return { error: "Impossibile migliorare l'oggetto dell'email. Controlla i log del server per i dettagli." };
  }
}

export async function sendEmailAction(params: SendEmailParams): Promise<{ success?: boolean; message: string }> {
  console.log("Tentativo di invio email:");
  console.log("Mittente:", params.senderEmail);
  console.log("Destinatari:", params.recipients.map(r => `${r.name} <${r.email}>`).join(', '));
  console.log("Oggetto:", params.subject);

  if (!params.senderEmail) {
    return { success: false, message: "Invio Fallito: Email mittente non configurata nelle impostazioni." };
  }
  if (!params.appPassword) {
    return { success: false, message: "Invio Fallito: Password per app non configurata nelle impostazioni." };
  }
  if (params.recipients.length === 0) {
    return { success: false, message: "Invio Fallito: Nessun destinatario selezionato." };
  }
   if (!params.body || params.body.trim() === "" || params.body.trim() === "<p><br></p>") {
    return { success: false, message: "Invio Fallito: Il corpo dell'email non può essere vuoto." };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: params.senderEmail,
      pass: params.appPassword,
    },
  });

  const mailOptions = {
    from: params.senderEmail,
    to: params.recipients.map(r => r.email).join(','),
    subject: params.subject,
    html: params.body, // Invia come HTML
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: `Email inviata con successo a ${params.recipients.length} destinatario/i.` };
  } catch (error: any) {
    console.error("Errore durante l'invio dell'email:", error);
    let errorMessage = "Si è verificato un errore durante l'invio dell'email.";
    if (error.code === 'EAUTH') {
      errorMessage = "Autenticazione fallita. Controlla l'email del mittente e la password per app nelle impostazioni.";
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = "Connessione al server di posta rifiutata. Controlla la tua connessione internet o le impostazioni del firewall.";
    }
    return { success: false, message: `${errorMessage} Dettagli: ${error.message}` };
  }
}
