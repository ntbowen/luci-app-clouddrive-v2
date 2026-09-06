# Copyright (C) 2024-2026 Zag <ntbowen2001@gmail.com>
# This is free software, licensed under the GNU General Public License v3.
# See /LICENSE for more information.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-clouddrive-v2
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=Zag <ntbowen2001@gmail.com>
PKG_LICENSE:=GPLv3
PKG_LICENSE_FILES:=LICENSE

LUCI_TITLE:=LuCI support for CloudDrive-v2 (native binary)
LUCI_DESCRIPTION:=Web interface to deploy and manage native CloudDrive2 binary on OpenWrt
LUCI_DEPENDS:=+luci-base +cgi-io +curl +wget-ssl +fuse3-utils +jsonfilter
LUCI_PKGARCH:=all

define Package/$(PKG_NAME)/conffiles
/etc/config/clouddrive2
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
chmod +x /etc/init.d/clouddrive2 2>/dev/null || true
chmod +x /usr/sbin/clouddrive2-ctl 2>/dev/null || true
rm -rf /tmp/luci-indexcache /tmp/luci-modulecache
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
