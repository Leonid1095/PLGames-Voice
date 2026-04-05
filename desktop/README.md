<div align="center">
<h1>
  PLG Voice Desktop
  
  [![Stars](https://img.shields.io/github/stars/Leonid1095/PLGames-Voice?style=flat-square&logoColor=white)](https://github.com/Leonid1095/PLGames-Voice/stargazers)
  [![Forks](https://img.shields.io/github/forks/Leonid1095/PLGames-Voice?style=flat-square&logoColor=white)](https://github.com/Leonid1095/PLGames-Voice/network/members)
  [![Pull Requests](https://img.shields.io/github/issues-pr/Leonid1095/PLGames-Voice?style=flat-square&logoColor=white)](https://github.com/Leonid1095/PLGames-Voice/pulls)
  [![Issues](https://img.shields.io/github/issues/Leonid1095/PLGames-Voice?style=flat-square&logoColor=white)](https://github.com/Leonid1095/PLGames-Voice/issues)
  [![Contributors](https://img.shields.io/github/contributors/Leonid1095/PLGames-Voice?style=flat-square&logoColor=white)](https://github.com/Leonid1095/PLGames-Voice/graphs/contributors)
  [![License](https://img.shields.io/github/license/Leonid1095/PLGames-Voice?style=flat-square&logoColor=white)](https://github.com/Leonid1095/PLGames-Voice/blob/main/LICENSE)
</h1>
Application for Windows, macOS, and Linux.
</div>
<br/>

## Installation

- All downloads and instructions can be found on our [Website](https://plgames-voice.ru).

## Development Guide

_Contribution guidelines for Desktop app TBA!_


Before getting started, you'll want to install:

- Git
- Node.js
- pnpm (run `corepack enable`)

Then proceed to setup:

```bash
# clone the repository
git clone --recursive https://github.com/Leonid1095/PLGames-Voice plgames-voice
cd plgames-voice/desktop

# install all packages
pnpm i --frozen-lockfile

# start the application
pnpm start
# ... or build the bundle
pnpm package
# ... or build all distributables
pnpm make
```

Various useful commands for development testing:

```bash
# connect to the development server
pnpm start -- --force-server http://localhost:5173

# test the flatpak (after `make`)
pnpm install:flatpak
pnpm run:flatpak
# ... also connect to dev server like so:
pnpm run:flatpak --force-server http://localhost:5173

# Nix-specific instructions for testing
pnpm package
pnpm run:nix
# ... as before:
pnpm run:nix --force-server=http://localhost:5173
# a better solution would be telling
# Electron Forge where system Electron is
```

### Pulling in assets

If you want to pull in brand assets after pulling, run the following:

```bash
# update the assets
git -c submodule."assets".update=checkout submodule update --init assets
```

Currently, this is required to build, any forks are expected to provide their own assets.
