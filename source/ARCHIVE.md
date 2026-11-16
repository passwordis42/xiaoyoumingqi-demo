# 源码归档说明

这一目录保存「小有名气」的源码、规则文档、测试和当时的报告。它和仓库根目录的试玩成品分开，不替换根目录的 `index.html`、`assets/` 和 `.nojekyll`。

- 归档包 sha256：`63066f718c77cfd2072797431a238970c3e0c817417b5bbea524ad708811c13f`
- 对应原草稿提交：`6894398f28f63e274618abb0d2c6237bcdfa1ef0`
- 包内没有 `.git`、`node_modules`、`dist` 和凭据。`package.json` 里的 `"private": true` 是 npm 不发布到注册表的原设置，照原样保留。
- 2026-11-16 迁移时，当前环境读取 `passwordis42/xiaoyoumingqi-web` 返回 HTTP 404，没能核对分支 `cursor/migrate-archive-pages-ef85` 的提交 `0b62b2b48e609d74695b10ffb1b1a5334c231d6b`。该分支后来增加的 Pages 工作流和迁移测试日志不在本目录。
- 本目录没有 GitHub Actions 工作流。不要把工作流放到仓库根目录的 `.github/workflows`，以免干扰根目录的 Pages 试玩。

在本目录里可以复现构建和测试：

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```
