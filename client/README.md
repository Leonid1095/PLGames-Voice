# PLG Voice Frontend

Web client for PLG Voice messenger, built with [Solid.js](https://www.solidjs.com/).

## Development

Install prerequisites:
- [Git](https://git-scm.com/install/)
- [mise-en-place](https://mise.jdx.dev/getting-started.html)

```bash
# clone and setup
git clone --recursive https://github.com/Leonid1095/PLGames-Voice.git
cd client

# install dependencies
mise install:frozen
mise build:deps

# configure environment
cp packages/client/.env.example packages/client/.env

# run dev server
mise dev
```

## Build for Production

```bash
mise install:frozen
mise build:deps
mise build
```

Deploy the `packages/client/dist` directory.

## Code Style

See [GUIDELINES.md](./GUIDELINES.md) for code style conventions.
