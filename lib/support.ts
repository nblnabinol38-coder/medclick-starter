export const SUPPORT_WHATSAPP_NUMBER = "5511918622785";
export const SUPPORT_WHATSAPP_DISPLAY = "+55 11 91862-2785";

export function supportWhatsAppUrl(
  message = "Olá! Preciso de suporte no MedClick.",
) {
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
