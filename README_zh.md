# luci-app-clouddrive-v2

用于在 OpenWrt 上原生部署和管理 CloudDrive2 的 LuCI 应用。

OpenWrt 包名：`luci-app-clouddrive-v2`。

<img width="3274" height="1436" alt="截图 2026-09-07 00-02-21" src="https://github.com/user-attachments/assets/19508f49-87de-49be-ba50-9507d0dfede6" />

## 功能

- 自动检测路由器架构，从 GitHub 下载匹配的 CloudDrive2 发行版。
- 检测部署状态（是否已安装/运行中/版本/路径/端口）。
- 列出 CloudDrive2 上游可用的版本号。
- 提供一键部署/升级、启动、停止、重启和卸载操作。
- 可在新标签页中打开 CloudDrive2 Web 页面，或以内嵌 iframe 形式预览。
- 实时显示部署日志。

## 支持的架构

CloudDrive2 上游目前仅提供以下 Linux 架构的预编译二进制：

| OpenWrt `uname -m` | CloudDrive2 资源前缀              |
|--------------------|----------------------------------|
| `x86_64`           | `clouddrive-2-linux-x86_64`      |
| `aarch64`          | `clouddrive-2-linux-aarch64`     |
| `armv7l` / `armv7` | `clouddrive-2-linux-armv7`       |

MIPS 及其他架构暂不受上游支持。

## 安装路径

默认安装路径为 `/opt/clouddrive2`，可通过 UCI 修改：

```sh
uci set clouddrive2.config.install_path='/mnt/sda1/clouddrive2'
uci commit clouddrive2
```

如果路由器 overlay 分区空间较小，建议将安装路径设置到外部 ext4 分区。

## 文件说明

- `/etc/config/clouddrive2` – UCI 配置
- `/etc/init.d/clouddrive2` – procd 服务脚本
- `/usr/sbin/clouddrive2-ctl` – 部署与管理后端脚本
- `/usr/share/luci/menu.d/luci-app-clouddrive-v2.json` – LuCI 菜单入口
- `/usr/share/rpcd/acl.d/luci-app-clouddrive-v2.json` – ACL 权限

## 注意事项

- 本包依赖 `curl`、`wget-ssl`、`fuse3-utils` 和 `jsonfilter`。
- 后端脚本运行时优先使用 `curl`，若不可用则回退到 `wget-ssl` / `wget`。
- CloudDrive2 需要 FUSE 才能将云盘挂载为本地文件系统。`fuse3-utils` 会引入 `libfuse3` → `kmod-fuse`，但运行的内核也需要启用 FUSE 支持。
- 如果通过 HTTPS 访问 LuCI，浏览器可能因混合内容策略阻止 HTTP 的 CloudDrive2 内嵌页面，此时请使用「在新标签页打开」按钮。
