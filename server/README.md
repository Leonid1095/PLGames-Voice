# PLG Voice Backend

The backend services and libraries that power the PLG Voice platform.

## Architecture

| Crate              | Path                                               | Description                         |
| ------------------ | -------------------------------------------------- | ----------------------------------- |
| `core/config`      | [crates/core/config](crates/core/config)           | Core: Configuration                 |
| `core/database`    | [crates/core/database](crates/core/database)       | Core: Database Implementation       |
| `core/files`       | [crates/core/files](crates/core/files)             | Core: S3 and encryption subroutines |
| `core/models`      | [crates/core/models](crates/core/models)           | Core: API Models                    |
| `core/permissions` | [crates/core/permissions](crates/core/permissions) | Core: Permission Logic              |
| `core/presence`    | [crates/core/presence](crates/core/presence)       | Core: User Presence                 |
| `core/result`      | [crates/core/result](crates/core/result)           | Core: Result and Error types        |
| `core/coalesced`   | [crates/core/coalesced](crates/core/coalesced)     | Core: Coalescion service            |
| `delta`            | [crates/delta](crates/delta)                       | REST API server                     |
| `bonfire`          | [crates/bonfire](crates/bonfire)                   | WebSocket events server             |
| `services/january` | [crates/services/january](crates/services/january) | Proxy server                        |
| `services/gifbox`  | [crates/services/gifbox](crates/services/gifbox)   | Tenor proxy server                  |
| `services/autumn`  | [crates/services/autumn](crates/services/autumn)   | File server                         |
| `daemons/crond`    | [crates/daemons/crond](crates/daemons/crond)       | Timed data clean up daemon server   |
| `daemons/pushd`    | [crates/daemons/pushd](crates/daemons/pushd)       | Push notification daemon server     |

## Minimum Supported Rust Version

Rust 1.86.0 or higher.

## Development Guide

Before getting started, you'll want to install:

- mise
- Docker
- Git
- mold (optional, faster compilation)

> A **default.nix** is available for Nix users!
> Run `nix-shell` to activate mise.

Development environment ports:

| Service                   |      Port      |
| ------------------------- | :------------: |
| MongoDB                   |     27017      |
| Redis                     |      6379      |
| MinIO                     |     14009      |
| Maildev                   | 14025<br>14080 |
| Web App                   |     14701      |
| RabbitMQ                  | 5672<br>15672  |
| `crates/delta`            |     14702      |
| `crates/bonfire`          |     14703      |
| `crates/services/autumn`  |     14704      |
| `crates/services/january` |     14705      |
| `crates/services/gifbox`  |     14706      |

Build and run:

```bash
mise build
```

A default configuration `Revolt.toml` is present in this project that is suited for development.

If you'd like to change anything, create a `Revolt.overrides.toml` file and specify relevant variables.

> [!TIP]
> Use Sentry to catch unexpected service errors:
>
> ```toml
> # Revolt.overrides.toml
> [sentry]
> api = "https://abc@your.sentry/1"
> events = "https://abc@your.sentry/1"
> files = "https://abc@your.sentry/1"
> proxy = "https://abc@your.sentry/1"
> ```

Then continue:

```bash
# start other necessary services
docker compose up -d

# run everything together
./scripts/start.sh
# .. or individually
cargo run --bin revolt-delta
cargo run --bin revolt-bonfire
cargo run --bin revolt-autumn
cargo run --bin revolt-january
cargo run --bin revolt-gifbox
cargo run --bin revolt-pushd

# hint:
# mold -run <cargo build, cargo run, etc...>
# mold -run ./scripts/start.sh
```

When signing up, go to http://localhost:14080 to find confirmation/password reset emails.

## Testing

First, start the required services:

```sh
docker compose -f docker-compose.db.yml up -d
```

Now run tests for whichever database:

```sh
TEST_DB=REFERENCE cargo nextest run
TEST_DB=MONGODB cargo nextest run
```

## License

The PLG Voice backend is licensed under the [GNU Affero General Public License v3.0](LICENSE).

**Individual crates may supply their own licenses!**
