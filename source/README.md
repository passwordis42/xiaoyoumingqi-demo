# 小有名气

五组互相独立的创作试验原型：卡槽、拼版、曲线、调音台、时机。这是可玩的规则试验，不是完整游戏，也没有接真实平台。

这里的数字都是可调的游戏试验规则，不是已经验证的平衡，不是真实平台算法，也不能保证现实中一定火。说明见 [RULES.md](RULES.md)，和规划附件的差异见 [DIFFERENCES.md](DIFFERENCES.md)。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:43123`。这是本机预览，不是公开部署。

## 构建静态包

```bash
npm run build
```

产物在 `dist/`。资源使用相对路径，可以放到子路径下用静态服务器打开，例如在 `dist` 目录里执行：

```bash
python3 -m http.server 43123
```

`npm run build` 会先把 `src/sim/rules.ts` 导出到 `public/rule-config.json`，再做类型检查和打包。页面里也可以下载同一份 JSON。

## 测试

```bash
npm test
npx playwright install chromium
npm run test:e2e
```

`npm test` 跑纯函数。`npm run test:e2e` 会拉起本机开发服务器，用浏览器走完五组试验。截图写到 `reports/screenshots/`。

## 私有仓库和试玩页

源码、`RULES.md`、`src/sim/rules.ts`、`public/rule-config.json`、测试和 `reports/` 都在私有仓库里。GitHub Actions 工作流 `.github/workflows/pages.yml` 只把编译后的 `dist/` 交给 GitHub Pages。

本地构建的 `base` 仍是相对路径 `./`。Pages 工作流把 `VITE_BASE` 设成项目子路径 `/xiaoyoumingqi-web/`。上传前会删掉 `dist/rule-config.json` 和所有 source map，不会上传 `src/`、`tests/`、`reports/`。

页面里的「导出规则 JSON」用内存里的规则生成文件，不请求独立的 `rule-config.json`。

编译出的 JavaScript 里仍然有规则数字、牌面和事件，因为五组试验要在浏览器里结算。不上传源码和独立 JSON，挡不住别人从脚本里读出这些内容。

这次没有把试玩页发出去。用仓库现有的 GitHub 安装身份调用 `POST /repos/passwordis42/xiaoyoumingqi-web/pages`（`build_type: workflow`）时，接口返回 HTTP 403，正文是 `{"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/pages/pages#create-a-apiname-pages-site","status":"403"}`，响应头 `x-accepted-github-permissions` 为 `pages=write,administration=write`。仓库仍是私有的。官方 `actions/configure-pages` 写明：用 `GITHUB_TOKEN` 不能创建 Pages 站点，GitHub App 需要上述两项写权限。工作流因此只在站点已经改成 GitHub Actions 之后才上传 `dist/`。
