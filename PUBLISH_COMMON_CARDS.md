# Publish `@ender-seti/common` and `@ender-seti/cards` (one-time official registry)

This project is a pnpm monorepo. The package publish order must be:

1. `@ender-seti/common`
2. `@ender-seti/cards`

`@ender-seti/cards` depends on `@ender-seti/common`, so do not publish cards first.

## Important constraints

- Use npm official registry only for this release.
- Do not permanently change local/global npm registry config.
- Always pass registry by command environment variable:
  - `NPM_CONFIG_REGISTRY=https://registry.npmjs.org`

## 0) Verify npm identity on official registry

```bash
cd /Users/oushuohuang/Documents/demo-a2ui
NPM_CONFIG_REGISTRY=https://registry.npmjs.org npm whoami
```

If not logged in, run:

```bash
npm login --registry=https://registry.npmjs.org
```

## 1) Build packages

```bash
cd /Users/oushuohuang/Documents/demo-a2ui
pnpm --filter @ender-seti/common build
pnpm --filter @ender-seti/cards build
```

## 2) Dry run publish

```bash
cd /Users/oushuohuang/Documents/demo-a2ui
NPM_CONFIG_REGISTRY=https://registry.npmjs.org pnpm --filter @ender-seti/common publish --access public --dry-run
NPM_CONFIG_REGISTRY=https://registry.npmjs.org pnpm --filter @ender-seti/cards publish --access public --dry-run
```

## 3) Publish to npm official registry

```bash
cd /Users/oushuohuang/Documents/demo-a2ui
NPM_CONFIG_REGISTRY=https://registry.npmjs.org pnpm --filter @ender-seti/common publish --access public
NPM_CONFIG_REGISTRY=https://registry.npmjs.org pnpm --filter @ender-seti/cards publish --access public
```

## Troubleshooting

- `E403` permission denied:
  - Current npm user does not have publish permission for the target scope/package.
- `cannot publish over existing version`:
  - Bump version in package `package.json` first, then publish again.
- `ENEEDAUTH`:
  - Login again with official registry and retry.
