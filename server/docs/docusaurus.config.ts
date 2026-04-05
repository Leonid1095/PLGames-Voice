import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type { ScalarOptions } from '@scalar/docusaurus';

const config: Config = {
  title: 'PLG Voice Developers',
  tagline: 'Developer documentation for PLG Voice',
  favicon: 'https://plgames-voice.ru/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://plgames-voice.ru',
  baseUrl: '/docs/',

  organizationName: 'Leonid1095',
  projectName: 'PLGames-Voice',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/Leonid1095/PLGames-Voice/tree/main/server/docs/',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@scalar/docusaurus',
      {
        label: 'API Reference',
        route: '/api-reference',
        showNavLink: true,
        configuration: {
          url: 'https://plgames-voice.ru/api/openapi.json',
        },
      } as ScalarOptions,
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        fromExtensions: ['html', 'htm'],
        redirects: [
          {
            from: '/developers/api/reference.html',
            to: '/api-reference',
          },
          {
            from: '/contrib.html',
            to: '/developing/contrib',
          },
          {
            from: '/contrib',
            to: '/developing/contrib',
          },
        ],
      }
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'PLG Voice Developers',
      logo: {
        alt: 'PLG Voice',
        src: 'https://plgames-voice.ru/favicon.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'index',
          label: 'Docs'
        },
        {
          href: 'https://github.com/Leonid1095/PLGames-Voice',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Developers',
          items: [
            {
              label: 'Source Code',
              href: 'https://github.com/Leonid1095/PLGames-Voice'
            },
          ],
        },
        {
          title: 'PLG Voice',
          items: [
            {
              label: 'Website',
              href: 'https://plgames-voice.ru'
            },
          ],
        },
      ],
      copyright: `PLG Voice, ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
