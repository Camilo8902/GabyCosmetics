import { motion } from 'framer-motion';
import { Sparkles, Star, Heart } from 'lucide-react';

export function FloatingDecorations() {
  return (
    <>
      {/* Floating sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className="w-4 h-4 text-rose-400/60" />
        </motion.div>
      ))}

      {/* Floating stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            y: [0, -15, 0],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        >
          <Star className="w-3 h-3 text-amber-400/50 fill-amber-400/50" />
        </motion.div>
      ))}

      {/* Floating hearts */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`heart-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        >
          <Heart className="w-5 h-5 text-rose-400/40 fill-rose-400/40" />
        </motion.div>
      ))}

      {/* Gradient orbs for ambient light */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl"
      />

      {/* Decorative circles */}
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full"
      />

      {/* Animated ring */}
      <motion.div
        animate={{
          scale: [1, 1.5],
          opacity: [0.3, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 border-2 border-rose-500/30 rounded-full"
      />
    </>
  );
}
