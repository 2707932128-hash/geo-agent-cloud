# GEO Agent Cloud Pages

这是 GEO Agent Cloud 的 GitHub Pages 静态部署包。

## 当前模式

当前是公网预览模式：

- 可以公开访问网页。
- 可以体验 GEO 自动部署 5 步向导。
- 包含 `llms.txt`、`robots.txt`、`schema.json`。
- 不会暴露你的本机真实 Audit API。

## GitHub 网页上传步骤

1. 登录 GitHub。
2. 新建仓库，例如 `geo-agent-cloud-pages`。
3. 上传本目录内所有文件到仓库根目录。
4. 进入仓库 `Settings -> Pages`。
5. Source 选择 `GitHub Actions`。
6. 进入 `Actions`，等待 `Deploy GEO Agent Cloud` 跑完。
7. GitHub 会生成一个公网链接，例如：

```text
https://你的用户名.github.io/geo-agent-cloud-pages/
```

## 验收地址

上线后检查：

- `/`
- `/llms.txt`
- `/robots.txt`
- `/schema.json`

## 后续

如果要从公网预览升级为真正 SaaS，需要继续接：

- 登录系统
- 数据库
- 后端 API
- GitHub 自动提交
- 云端 GEO Audit
