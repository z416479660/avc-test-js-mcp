# 发布到 npm 指南

本文档介绍如何将 avc-test-js-mcp 发布到 npm。

## 前置准备

1. **注册 npm 账号**
   - 访问 https://www.npmjs.com/signup
   - 注册并验证邮箱
   - 开启双因素认证 (2FA)

2. **登录 npm**
   ```bash
   npm login
   # 按提示输入用户名、密码、邮箱
   ```

## 发布步骤

### 1. 确保代码准备就绪

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 验证构建成功
ls dist/
# 应该包含 server.js 和 server.d.ts
```

### 2. 更新版本号

修改 `package.json` 中的版本号：
```json
{
  "version": "0.1.0"
}
```

版本号规范（语义化版本）：
- 补丁版本：`0.1.1`（bug 修复）
- 次要版本：`0.2.0`（新功能，向后兼容）
- 主要版本：`1.0.0`（重大变更）

### 3. 检查发布内容

```bash
# 查看将要发布的文件
npm publish --dry-run
```

确认只包含必要文件：
- dist/
- LICENSE
- README.md
- package.json

### 4. 发布到 npm

```bash
# 正式发布
npm publish

# 如果是首次发布，可能需要加 --access public（作用域包）
npm publish --access public
```

### 5. 验证发布

```bash
# 等待几分钟让 npm 索引更新
npm view avc-test-js-mcp

# 全局安装测试
npm install -g avc-test-js-mcp
avc-test-js-mcp --help

# 或使用 npx
npx avc-test-js-mcp --help
```

### 6. 创建 Git 标签（可选）

```bash
git add .
git commit -m "Release v0.1.0"
git tag v0.1.0
git push origin v0.1.0
git push
```

---

## 更新已发布的包

### 发布补丁版本

```bash
# 自动更新补丁版本号（0.1.0 -> 0.1.1）
npm version patch

# 构建
npm run build

# 发布
npm publish
```

### 发布次要版本

```bash
npm version minor
npm run build
npm publish
```

### 发布主要版本

```bash
npm version major
npm run build
npm publish
```

---

## 故障排除

### 发布失败：包名已被占用

```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/avc-test-js-mcp - You do not have permission to publish "avc-test-js-mcp"
```

解决方法：
- 更换包名（修改 `package.json` 中的 `name` 字段）
- 或者联系包所有者获取权限

### 发布失败：版本已存在

```
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/avc-test-js-mcp - cannot modify pre-existing version
```

解决方法：
1. 更新版本号
2. 重新构建
3. 重新发布

### 发布失败：未登录

```
npm ERR! code ENEEDAUTH
```

解决方法：
```bash
npm login
```

### 发布失败：2FA 问题

如果开启了 2FA，发布时需要提供 OTP：
```bash
npm publish --otp=123456
```

---

## 自动化发布（GitHub Actions）

创建 `.github/workflows/publish-npm.yml`：

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

在 GitHub 仓库设置中添加 `NPM_TOKEN` secret（从 npm 个人访问令牌获取）。

---

## 发布检查清单

- [ ] 代码已提交到 git
- [ ] 版本号已更新
- [ ] 已运行 `npm run build` 且成功
- [ ] `README.md` 已更新
- [ ] `CHANGELOG.md` 已更新（可选）
- [ ] `npm publish --dry-run` 显示正确
- [ ] 已登录 npm (`npm whoami`)
- [ ] 2FA 已准备好（如开启）


npm 打包发布: https://juejin.cn/post/7594678044263497728