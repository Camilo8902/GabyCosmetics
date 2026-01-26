import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Award, Truck, Clock, Shield } from 'lucide-react';
import { useStaticContent } from '@/hooks/useStaticContent';

const features = [
  {
    icon: Award,
    titleKey: 'why_us.quality',
    descKey: 'why_us.quality_desc',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
  },
  {
    icon: Truck,
    titleKey: 'why_us.shipping',
    descKey: 'why_us.shipping_desc',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
  },
  {
    icon: Clock,
    titleKey: 'why_us.support',
    descKey: 'why_us.support_desc',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Shield,
    titleKey: 'why_us.secure',
    descKey: 'why_us.secure_desc',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
  },
];

export function WhyChooseUs() {
  const { t } = useTranslation();
  const { data: staticContent } = useStaticContent();

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-rose-600 font-medium tracking-wider uppercase text-sm">
            {staticContent.promise.subtitle || 'Nuestra Promesa'}
          </span>
          <h2 className="mt-2 text-4xl md:text-5xl font-serif font-bold text-gray-900">
            {staticContent.promise.title || t('why_us.title')}
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '4rem' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="h-1 bg-rose-600 mx-auto mt-4 rounded-full"
          />
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group"
            >
              <div className="text-center p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300">
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-20 h-20 mx-auto rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6`}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(feature.descKey)}
                </p>

                {/* Decorative line */}
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '3rem' }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`h-1 bg-gradient-to-r ${feature.color} mx-auto mt-6 rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-16"
        >
          {[
            { label: 'Envío Gratis', sub: 'En pedidos +$500' },
            { label: 'Garantía', sub: '30 días' },
            { label: 'Clientes', sub: '+50,000' },
            { label: 'Productos', sub: '+500' },
          ].map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-gray-900">{badge.label}</p>
              <p className="text-sm text-gray-500">{badge.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
