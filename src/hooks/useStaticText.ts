import { useEffect, useState } from 'react';
import { useStaticTextStore } from '@/store/staticTextStore';
import { getStaticContent } from '@/services/staticTextService';

export function useStaticText() {
  const store = useStaticTextStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const content = await getStaticContent();

        if (content) {
          store.setAllContent({
            hero: content.hero || store.hero,
            promise: content.promise || store.promise,
            testimonials: content.testimonials || store.testimonials,
            footer: content.footer || store.footer,
          });
        }
      } catch (err) {
        console.warn('⚠️ Using default content:', err);
        // Will use default values from store
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  return {
    ...store,
    isLoading,
    error,
  };
}
