import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.nhgppo.co.uk',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
