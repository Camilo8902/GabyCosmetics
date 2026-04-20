import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useStaticContent } from '@/hooks/useStaticContent';

export function WhatsAppButton() {
  const { data: staticContent } = useStaticContent();
  
  const phone = staticContent?.footer?.contact?.phone || '+1234567890';
  const cleanPhone = phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-8 h-8 text-white" fill="white" />
    </motion.a>
  );
}