import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, X, Maximize2 } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  order_index: number;
  is_primary: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  image_url?: string; // Fallback for products without images array
}

export function ProductImageGallery({ images, productName, image_url }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showLightbox, setShowLightbox] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine images array with image_url fallback
  const allImages = (() => {
    if (images && images.length > 0) {
      return images;
    }
    if (image_url) {
      return [{
        id: 'primary',
        url: image_url,
        alt_text: productName,
        order_index: 0,
        is_primary: true,
      }];
    }
    return [];
  })();

  const currentImage = allImages[selectedIndex];

  const goToPrevious = () => {
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const goToNext = () => {
    setSelectedIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return;

    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomPosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          setShowLightbox(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (showLightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [showLightbox]);

  if (allImages.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center"
      >
        <div className="text-center text-gray-400">
          <Maximize2 size={48} className="mx-auto mb-2" />
          <p>Sin imagen disponible</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Main Image with Zoom */}
        <div 
          ref={containerRef}
          className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group cursor-zoom-in"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setShowLightbox(true)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage?.id}
              ref={imageRef}
              src={currentImage?.url}
              alt={currentImage?.alt_text || productName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isZoomed ? 'scale-150' : 'group-hover:scale-105'
              }`}
              style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
            />
          </AnimatePresence>

          {/* Zoom hint */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-opacity ${
            isZoomed ? 'opacity-0' : 'opacity-100'
          }`}>
            <ZoomIn size={16} />
            Hover para hacer zoom
          </div>

          {/* Navigation arrows (visible on hover) */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Primary badge */}
          {currentImage?.is_primary && (
            <span className="absolute top-4 left-4 bg-pink-600 text-white text-xs px-2 py-1 rounded-full">
              Principal
            </span>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-pink-600 ring-2 ring-pink-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt_text || `${productName} - Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Navigation */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Counter */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm"
            >
              {selectedIndex + 1} / {allImages.length}
            </motion.div>

            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage?.id}
                src={currentImage?.url}
                alt={currentImage?.alt_text || productName}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-[90vw] max-h-[85vh] object-contain"
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
