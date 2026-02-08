import { lazy, Suspense } from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { CategoriesSection } from '@/components/landing/CategoriesSection';
import { WhyChooseUs } from '@/components/landing/WhyChooseUs';
import { Newsletter } from '@/components/landing/Newsletter';
import { RecentProducts } from '@/components/landing/RecentProducts';

// Lazy load product sections for better performance
const FeaturedProducts = lazy(() =>
  import('@/components/landing/FeaturedProducts').then((m) => ({
    default: m.FeaturedProducts,
  }))
);
const BestSellers = lazy(() =>
  import('@/components/landing/BestSellers').then((m) => ({
    default: m.BestSellers,
  }))
);

// Placeholder component while loading
function LoadingPlaceholder() {
  return (
    <div className="py-24 bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <main>
      <HeroSection />
      <CategoriesSection />
      <Suspense fallback={<LoadingPlaceholder />}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={<LoadingPlaceholder />}>
        <BestSellers />
      </Suspense>
      <RecentProducts />
      <WhyChooseUs />
      <Newsletter />
    </main>
  );
}
