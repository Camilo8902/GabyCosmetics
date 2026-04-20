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
      animate={{ scale: 1, opacity: 1, transition: { delay: 0.5 } }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Contactar por WhatsApp"
    >
      {/* Pulse effect */}
      <span className="absolute inset-0 w-16 h-16 bg-green-500 rounded-full animate-ping opacity-75" />
      
      {/* Main button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/40 hover:shadow-2xl hover:shadow-green-500/50 transition-all"
      >
        <MessageCircle className="w-8 h-8 text-white" fill="white" />
      </motion.div>
    </motion.a>
  );
}