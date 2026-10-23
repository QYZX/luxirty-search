# AGENTS.md

项目说明、架构和约定见 [CLAUDE.md](./CLAUDE.md)。

## 编译 / 验证

本项目的正式编译统一使用 Docker 镜像构建：

```sh
docker image build --tag luxirty-search .
```

提交前至少运行一次该命令。`pnpm build` 只用于本地快速检查，不作为最终编译验证。
