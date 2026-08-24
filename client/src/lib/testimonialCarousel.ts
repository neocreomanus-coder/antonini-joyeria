export type TestimonialPreview = {
  id?: string | number;
  name?: string | null;
  comment?: string | null;
};

export function getRenderableTestimonials(testimonials: TestimonialPreview[] | undefined | null) {
  return (testimonials ?? []).filter((testimonial): testimonial is TestimonialPreview & { name: string; comment: string } =>
    Boolean(testimonial && testimonial.name?.trim() && testimonial.comment?.trim())
  );
}

export function getTestimonialWindow<T>(testimonials: T[], startIndex: number, maximum = 3): T[] {
  if (!testimonials.length) return [];
  const safeStartIndex = ((startIndex % testimonials.length) + testimonials.length) % testimonials.length;
  return Array.from(
    { length: Math.min(maximum, testimonials.length) },
    (_, offset) => testimonials[(safeStartIndex + offset) % testimonials.length]
  );
}
