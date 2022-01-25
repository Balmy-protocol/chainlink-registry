# Chainlink Registry

[![Lint](https://github.com/Mean-Finance/chainlink-registry/actions/workflows/lint.yml/badge.svg)](https://github.com/Mean-Finance/chainlink-registry/actions/workflows/lint.yml)
[![Tests (unit, integration)](https://github.com/Mean-Finance/chainlink-registry/actions/workflows/tests.yml/badge.svg)](https://github.com/Mean-Finance/chainlink-registry/actions/workflows/tests.yml)

This repository contains all necessary smart contracts for our own version of [Chainlink's Feed Registry](https://docs.chain.link/docs/feed-registry/). Since they don't have it deployed to all chains, we needed to build and maintain our own.

## 📖 Docs

Check our docs at [docs.mean.finance](https://docs.mean.finance)

## 👨‍💻 Development environment

- Copy environment file

```bash
cp .env.example .env
```

- Fill environment file with your information

```bash
nano .env
```

## 🧪 Testing

### Unit

```bash
yarn test:unit
```

Will run all tests under [test/unit](./test/unit)

### Integration

You will need to set up the development environment first, please refer to the [development environment](#-development-environment) section.

```bash
yarn test:integration
```

Will run all tests under [test/integration](./test/integration)

## 🚢 Deployment

You will need to set up the development environment first, please refer to the [development environment](#-development-environment) section.

```bash
yarn deploy --network [network]
```

The plugin `hardhat-deploy` is used to deploy contracts.

## Licensing

The primary license for DCA V2 Periphery is the GNU General Public License v2.0 (`GPL-2.0-or-later`), see [`LICENSE`](./LICENSE).

### Exceptions

- All files in `contracts/mocks` remain unlicensed.
