import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en-US', 'fr'],
  defaultLocale: 'en-US',
  localePrefix: 'never',
  localeDetection: true,
});
