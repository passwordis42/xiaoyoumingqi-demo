# 源码归档说明

迁移完成。`source/` 已保存私有库 `xiaoyoumingqi-web` 提交 `0b62b2b48e609d74695b10ffb1b1a5334c231d6b` 的工作区文件。根目录试玩成品没有改动。

- 最终归档包 sha256：`a8c429db11890ea5f03816463911ef7a5f4184d0c820918c3cf8c98baee3e683`
- 该提交 tarball 里的每个文件，都与 `source/` 下同相对路径逐字节相同。本说明是公开库额外加上的，不在那次提交里。
- 更早草稿包 sha256 `63066f718c77cfd2072797431a238970c3e0c817417b5bbea524ad708811c13f`、草稿提交 `6894398f28f63e274618abb0d2c6237bcdfa1ef0` 的文件已包含在这次完整提交中，并补上了其后的差异。
- 没有带入 `.git` 历史、`node_modules`、`dist`、缓存或凭据。官方 tarball 里也没有这些内容。
- `package.json` 的 `"private": true` 是 npm 不发布到注册表的原设置，照原样保留。

## 这次相对上一份公开 source 的差异

新增：

- `.github/workflows/pages.yml`
- `reports/migration-build.log`
- `reports/migration-e2e.log`
- `reports/migration-touch-subpath.log`
- `reports/migration-unit.log`

按该提交替换：

- `.gitignore`
- `README.md`
- `e2e/touch.spec.ts`
- `reports/screenshots/touch-e.png`
- `vite.config.ts`

其余 52 个文件与上一份公开 `source/` 已经相同。

## 工作流只留在 source 内

`source/.github/workflows/pages.yml` 是私有库原文件，路径和内容都按该提交保存。它的 `VITE_BASE` 仍写着旧项目路径 `/xiaoyoumingqi-web/`。不要把这个文件移到本仓库根目录的 `.github/workflows/`，否则会在 demo 上按旧路径构建并触发另一套部署。demo 试玩继续用已经启用的 Pages：`main` 根目录。

`source/README.md` 也是该提交的原文。它仍写着当时源码在私有库、试玩页还没有发出去。那是历史记录。现在的试玩在仓库根目录，源码在本目录。
