import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  CreditCard,
  Truck,
} from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    quickLinks: [
      { label: t('nav.home'), href: '/' },
      { label: t('nav.shop'), href: '/shop' },
      { label: t('nav.categories'), href: '/categories' },
      { label: t('nav.about'), href: '/about' },
      { label: t('nav.contact'), href: '/contact' },
    ],
    customerService: [
      { label: t('footer.faq'), href: '/faq' },
      { label: t('footer.shipping'), href: '/shipping' },
      { label: t('footer.returns'), href: '/returns' },
      { label: t('footer.contact_us'), href: '/contact' },
    ],
    legal: [
      { label: t('footer.privacy'), href: '/privacy' },
      { label: t('footer.terms'), href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Gaby Cosmetics" className="h-12 w-auto invert" />
              <span className="font-serif text-xl font-bold tracking-wider">
                GABY COSMETICS
              </span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Descubre cosméticos premium con ingredientes naturales. Belleza consciente para la mujer moderna.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-bold mb-6">{t('footer.quick_links')}</h3>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-rose-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-rose-400 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Customer Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-6">{t('footer.customer_service')}</h3>
            <ul className="space-y-3">
              {footerLinks.customerService.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-rose-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-rose-400 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-rose-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold mb-6">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  Calle Principal 123, Madrid, España
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-rose-400" />
                <a href="tel:+34912345678" className="text-gray-400 hover:text-rose-400 transition-colors">
                  +34 91 234 5678
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-rose-400" />
                <a href="mailto:info@gabycosmetics.com" className="text-gray-400 hover:text-rose-400 transition-colors">
                  info@gabycosmetics.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-rose-400" />
                <span className="text-gray-400">
                  Lun - Vie: 9:00 - 18:00
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Payment & Shipping Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-gray-400">
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">Pago Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Truck className="w-5 h-5" />
              <span className="text-sm">Envío Gratis +$500</span>
            </div>
          </div>

          {/* Payment Methods Placeholder */}
          <div className="flex justify-center gap-4 mb-8">
            {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((method, index) => (
              <div
                key={index}
                className="w-12 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-gray-400"
              >
                {method}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Copyright */}
      <div className="bg-black/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Gaby Cosmetics. {t('footer.rights')}.
            </p>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              Hecho con <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> en México
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
