import { supabase } from '@/lib/supabase';
import type { HeroContent, PromiseContent, TestimonialsContent, FooterContent } from '@/store/staticTextStore';

const TABLE = 'static_content';

export async function getStaticContent() {
  try {
    const { data, error } = await supabase.from(TABLE).select('*').single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('❌ Error fetching static content:', error);
    throw error;
  }
}

export async function updateStaticContent(
  content: {
    hero?: HeroContent;
    promise?: PromiseContent;
    testimonials?: TestimonialsContent;
    footer?: FooterContent;
  },
  id?: string
) {
  try {
    if (id) {
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          ...content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Static content updated:', data);
      return data;
    } else {
      // If no ID provided, try to get existing record
      const existing = await getStaticContent();

      if (existing) {
        return updateStaticContent(content, existing.id);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from(TABLE)
          .insert({
            ...content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Static content created:', data);
        return data;
      }
    }
  } catch (error) {
    console.error('❌ Error updating static content:', error);
    throw error;
  }
}

export async function updateHero(hero: HeroContent) {
  return updateStaticContent({ hero });
}

export async function updatePromise(promise: PromiseContent) {
  return updateStaticContent({ promise });
}

export async function updateTestimonials(testimonials: TestimonialsContent) {
  return updateStaticContent({ testimonials });
}

export async function updateFooter(footer: FooterContent) {
  return updateStaticContent({ footer });
}
