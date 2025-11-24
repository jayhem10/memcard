import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Matcher pour les routes avec ou sans locale
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
