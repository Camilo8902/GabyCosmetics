import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  productCount: number;
  image: string;
  color: string;
  index: number;
}

export function CategoryCard({ category, productCount, image, color, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group"
    >
      <Link to={`/shop?category=${category.slug}`}>
        <div className="relative h-96 rounded-3xl overflow-hidden shadow-xl">
          {/* Background Image */}
          <div className="absolute inset-0">
            <motion.img
              src={image}
              alt={category.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6 }}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-60 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-white/80 text-sm">
                {productCount} {productCount === 1 ? 'producto' : 'productos'}
              </span>
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mt-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-white/80 text-sm mt-2 line-clamp-2">
                  {category.description}
                </p>
              )}
              <motion.div
                className="mt-4 flex items-center gap-2 text-white font-medium"
                whileHover={{ x: 5 }}
              >
                <span>Ver todo</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </motion.div>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <motion.div
            className="absolute top-6 right-6 w-16 h-16 border-2 border-white/30 rounded-full"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <div className="absolute top-8 right-8 w-12 h-12 border-2 border-white/20 rounded-full" />
        </div>
      </Link>
    </motion.div>
  );
}
