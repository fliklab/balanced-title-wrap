# balanced-title-wrap

An open-source, punctuation-aware title wrapping library with an interactive
preview site.

## Repository structure

- `packages/balanced-title-wrap`: the dependency-free npm package
- `app`: the interactive preview site, which imports the workspace package

The preview source is kept in the repository, but npm only publishes the files
declared by the package in `packages/balanced-title-wrap/package.json`.

## Development

```bash
npm install
npm test
npm run dev
```

## Package

```bash
npm run build:package
npm run test:package
npm run pack:check
```

See the [package README](packages/balanced-title-wrap/README.md) for API and
usage examples.

## Demo

[Balance Wrap Lab](https://balance-wrap-lab.jsh852.chatgpt.site)

## License

MIT

## Releasing

Releases are published from GitHub after the package name and npm owner are
confirmed. The first publish requires an npm account with 2FA and either a
granular automation token stored as `NPM_TOKEN` or a configured npm trusted
publisher. Subsequent GitHub Releases trigger the publish workflow.
