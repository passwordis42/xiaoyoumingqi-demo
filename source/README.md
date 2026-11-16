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
