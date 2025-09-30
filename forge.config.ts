import { MakerAppX } from "@electron-forge/maker-appx";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerFlatpak } from "@electron-forge/maker-flatpak";
import { MakerFlatpakOptionsConfig } from "@electron-forge/maker-flatpak/dist/Config";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { PublisherGithub } from "@electron-forge/publisher-github";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { globSync } from "node:fs";

const STRINGS = {
  name: "Stoat",
  execName: "stoat-desktop",
  description: "Open source user-first chat platform.",
};

const ASSET_DIR = "assets/desktop";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: STRINGS.name,
    executableName: STRINGS.execName,
    icon: `${ASSET_DIR}/icon`,
    extraResource: [
      // include all the asset files
      ...globSync(ASSET_DIR + "/**/*"),
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerAppX({}),
    new MakerSquirrel({
      iconUrl: `${ASSET_DIR}/icon.ico`,
    }),
    new MakerFlatpak({
      options: {
        id: "chat.stoat.stoat-desktop",
        description: STRINGS.description,
        productName: STRINGS.name,
        productDescription: STRINGS.description,
        runtimeVersion: "21.08",
        icon: `${ASSET_DIR}/icon.png`,
        categories: ["Network"],
        modules: [
          // use the latest zypak -- Electron sandboxing for Flatpak
          {
            name: "zypak",
            sources: [
              {
                type: "git",
                url: "https://github.com/refi64/zypak",
                tag: "v2025.09",
              },
            ],
          },
        ],
        finishArgs: [
          // default arguments found by running
          // DEBUG=electron-installer-flatpak* pnpm make
          "--socket=x11",
          "--share=ipc",
          "--device=dri",
          "--socket=pulseaudio",
          "--filesystem=home",
          "--env=TMPDIR=/var/tmp",
          "--share=network",
          "--talk-name=org.freedesktop.Notifications",
          // add Unity talk name for badges
          "--talk-name=com.canonical.Unity",
        ],
        // files: [
        //   // is this necessary?
        //   // https://stackoverflow.com/q/79745700
        //   ...[16, 32, 64, 128, 256, 512].map(
        //     (size) =>
        //       [
        //         `assets/desktop/hicolor/${size}x${size}.png`,
        //         `/app/share/icons/hicolor/${size}x${size}/apps/chat.stoat.stoat-desktop.png`,
        //       ] as [string, string],
        //   ),
        //   [
        //     `assets/desktop/icon.svg`,
        //     `/app/share/icons/hicolor/scalable/apps/chat.stoat.stoat-desktop.svg`,
        //   ] as [string, string],
        // ],
        files: [],
      } as MakerFlatpakOptionsConfig,
      /* as Omit<
        MakerFlatpakOptionsConfig,
        "files"
      > */
    }),
    new MakerDeb({
      options: {
        icon: `${ASSET_DIR}/icon.png`,
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "stoatchat",
        name: "for-desktop",
      },
    }),
  ],
};

export default config;
