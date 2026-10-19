<template>
  <ConfigProvider :theme="{
    algorithm: themeStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm
  }">
    <Layout class="app-layout">
      <!-- 桌面 + 平板：固定 Sider；手机：隐藏 -->
      <Layout.Sider v-if="!isMobile" v-model:collapsed="collapsed" collapsible :trigger="null"
        :collapsed-width="siderCollapsedWidth" class="app-sider">
        <div class="logo">
          <span v-if="!collapsed">{{ t('login.title') }}</span>
          <span v-else class="logo-collapsed">A</span>
        </div>

        <Menu theme="dark" mode="inline" :selected-keys="selectedKeys" @click="handleMenuClick">
          <Menu.Item v-for="item in menuItems" :key="item.key">
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </Menu.Item>
        </Menu>
      </Layout.Sider>

      <!-- 手机：Drawer 抽屉导航 -->
      <Drawer v-if="isMobile" :open="drawerVisible" placement="left" :width="drawerWidth" :closable="true"
        root-class-name="app-nav-drawer" :body-style="{ padding: 0 }" @close="drawerVisible = false">
        <div class="drawer-logo">
          <span>{{ t('login.title') }}</span>
        </div>
        <Menu :theme="themeStore.isDark ? 'dark' : 'light'" mode="inline" :selected-keys="selectedKeys"
          @click="handleDrawerMenuClick">
          <Menu.Item v-for="item in menuItems" :key="item.key">
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </Menu.Item>
        </Menu>
      </Drawer>

      <Layout class="app-layout-main">
        <Layout.Header class="app-header">
          <div class="header-left">
            <!-- 手机：hamburger 打开 Drawer；桌面板：折叠 Sider -->
            <Button type="text" class="trigger" @click="isMobile ? (drawerVisible = true) : (collapsed = !collapsed)">
              <template #icon>
                <MenuOutlined v-if="isMobile" />
                <MenuUnfoldOutlined v-else-if="collapsed" />
                <MenuFoldOutlined v-else />
              </template>
            </Button>

            <Breadcrumb v-if="!isMobile" class="breadcrumb">
              <Breadcrumb.Item>{{ breadcrumbLabel }}</Breadcrumb.Item>
            </Breadcrumb>
          </div>

          <div class="header-right">
            <Space :size="isMobile ? 8 : 'middle'">
              <!-- 鼠标拖尾 Pill -->
              <Dropdown :trigger="['hover']">
                <span class="toolbar-chip">
                  <svg class="chip-icon chip-icon--mouse" viewBox="0 0 24 24" width="14" height="14" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="7" />
                    <path d="M12 6v4" />
                  </svg>
                  <span v-if="!isMobile" class="chip-label">{{ trailLabel }}</span>
                  <CaretDownOutlined v-if="!isMobile" class="chip-caret" />
                </span>
                <template #overlay>
                  <Menu :selectedKeys="[trailStore.active]" @click="handleTrailMenuClick" class="header-dropdown-menu">
                    <Menu.Item key="none">
                      <Space>
                        <StopOutlined />
                        <span>{{ t('trail.none') }}</span>
                      </Space>
                    </Menu.Item>
                    <Menu.Item key="cursor">
                      <Space>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                        </svg>
                        <span>{{ t('trail.cursor') }}</span>
                      </Space>
                    </Menu.Item>
                    <Menu.Item key="pixel">
                      <Space>
                        <AppstoreOutlined />
                        <span>{{ t('trail.pixel') }}</span>
                      </Space>
                    </Menu.Item>
                    <Menu.Item key="textRain">
                      <Space>
                        <SmileOutlined />
                        <span>{{ t('trail.textRain') }}</span>
                      </Space>
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>

              <!-- 语言切换 Pill -->
              <Dropdown :trigger="['hover']">
                <span class="toolbar-chip">
                  <GlobalOutlined class="chip-icon" />
                  <span v-if="!isMobile" class="chip-label">{{ localeLabel }}</span>
                  <CaretDownOutlined v-if="!isMobile" class="chip-caret" />
                </span>
                <template #overlay>
                  <Menu :selectedKeys="[locale]" @click="handleLocaleMenuClick" class="header-dropdown-menu">
                    <Menu.Item key="zh-CN">{{ t('language.zhCN') }}</Menu.Item>
                    <Menu.Item key="en-US">{{ t('language.enUS') }}</Menu.Item>
                  </Menu>
                </template>
              </Dropdown>

              <Switch :checked="themeStore.isDark" checked-children="🌙" un-checked-children="☀️"
                @change="themeStore.toggleTheme" />

              <Dropdown>
                <Space class="user-info" style="cursor: pointer">
                  <Avatar size="small">
                    <template #icon>
                      <UserOutlined />
                    </template>
                  </Avatar>
                  <span v-if="!isMobile" class="user-name">Admin</span>
                </Space>
                <template #overlay>
                  <Menu>
                    <Menu.Item key="profile">
                      <UserOutlined />
                      {{ t('header.profile') }}
                    </Menu.Item>
                    <Menu.Item key="settings">
                      <SettingOutlined />
                      {{ t('header.settings') }}
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="logout" @click="handleLogout">
                      <LogoutOutlined />
                      {{ t('header.logout') }}
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </Space>
          </div>
        </Layout.Header>

        <Layout.Content class="app-content">
          <div class="content-inner">
            <router-view />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  </ConfigProvider>
</template>

<script setup lang="ts">
  defineOptions({
    name: 'MainLayout',
  });
  import { ref, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import {
    Layout,
    Menu,
    Button,
    Dropdown,
    Switch,
    Space,
    Avatar,
    Breadcrumb,
    Drawer,
    theme,
    ConfigProvider
  } from 'ant-design-vue';
  import {
    DashboardOutlined,
    UserOutlined,
    ShoppingOutlined,
    OrderedListOutlined,
    BarChartOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MenuOutlined,
    LogoutOutlined,
    GlobalOutlined,
    StopOutlined,
    AppstoreOutlined,
    SmileOutlined,
    CaretDownOutlined
  } from '@ant-design/icons-vue';
  import { useThemeStore } from '@/stores/theme';
  import { useTrailStore } from '@/stores/trail';
  import { useAuthStore } from '@/stores/auth';
  import { useResponsive } from '@/composables/useResponsive';
  import type { TrailKey } from '@/stores/trail';

  const { t, locale } = useI18n();
  const router = useRouter();
  const route = useRoute();
  const themeStore = useThemeStore();
  const trailStore = useTrailStore();
  const authStore = useAuthStore();
  const { isMobile, isTablet } = useResponsive();

  const collapsed = ref(false);
  const drawerVisible = ref(false);

  const siderCollapsedWidth = computed(() => (isTablet.value ? 0 : 80));

  const drawerWidth = computed(() =>
    typeof window !== 'undefined' ? window.innerWidth * 0.8 : 280
  );

  const selectedKeys = computed(() => {
    const path = route.path;
    if (path === '/') return ['dashboard'];
    return [path.replace('/', '')];
  });

  const menuItems = computed(() => [
    { key: 'dashboard', icon: DashboardOutlined, label: t('sidebar.dashboard'), path: '/' },
    { key: 'users', icon: UserOutlined, label: t('sidebar.users'), path: '/users' },
    { key: 'products', icon: ShoppingOutlined, label: t('sidebar.products'), path: '/products' },
    { key: 'orders', icon: OrderedListOutlined, label: t('sidebar.orders'), path: '/orders' },
    { key: 'analytics', icon: BarChartOutlined, label: t('sidebar.analytics'), path: '/analytics' },
    { key: 'settings', icon: SettingOutlined, label: t('sidebar.settings'), path: '/settings' }
  ]);

  const breadcrumbLabel = computed(() => {
    const path = route.path;
    const key = path === '/' ? 'dashboard' : path.replace('/', '');
    const labels: Record<string, string> = {
      dashboard: 'sidebar.dashboard',
      users: 'sidebar.users',
      products: 'sidebar.products',
      orders: 'sidebar.orders',
      analytics: 'sidebar.analytics',
      settings: 'sidebar.settings'
    };
    return labels[key] ? t(labels[key]) : path;
  });

  const trailLabels: Record<TrailKey, string> = {
    none: 'trail.none',
    cursor: 'trail.cursor',
    pixel: 'trail.pixel',
    textRain: 'trail.textRain',
  };

  const trailLabel = computed(() => t(trailLabels[trailStore.active]));

  const localeLabels: Record<string, string> = {
    'zh-CN': '中文',
    'en-US': 'EN',
  };

  const localeLabel = computed(() => localeLabels[locale.value] || locale.value);

  function handleMenuClick(info: { key: string | number }) {
    const item = menuItems.value.find((i) => i.key === String(info.key));
    if (item) {
      router.push(item.path);
    }
  }

  function handleDrawerMenuClick(info: { key: string | number }) {
    handleMenuClick(info);
    drawerVisible.value = false;
  }

  function handleLocaleMenuClick(info: { key: string | number }) {
    const value = String(info.key);
    locale.value = value;
    localStorage.setItem('locale', value);
  }

  function handleTrailMenuClick(info: { key: string | number }) {
    trailStore.setTrail(String(info.key) as TrailKey);
  }

  function handleLogout() {
    authStore.logout();
  }
</script>

<style scoped>
  /* ==========================================
   Layout — 移动优先
   ========================================== */

  .app-layout {
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* -------- Sider -------- */
  .app-sider {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
    z-index: 10;
  }

  .app-sider :deep(.ant-layout-sider-children) {
    overflow-x: hidden;
  }

  /* -------- Logo -------- */
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--header-height-mobile);
    color: #fff;
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: 2px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    white-space: nowrap;
  }

  .logo-collapsed {
    font-size: var(--text-xl);
    font-weight: 700;
  }

  /* -------- Drawer Logo (Mobile) -------- */
  .drawer-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--header-height-mobile);
    padding: 0 var(--space-lg);
    font-size: var(--text-lg);
    font-weight: 600;
    letter-spacing: 2px;
    /* 优先走 antd 令牌 */
    color: var(--ant-color-text);
    background: var(--ant-color-bg-container);
  }

  [data-theme="dark"] .drawer-logo {
    color: rgba(255, 255, 255, 0.9);
    background: var(--ant-color-bg-elevated, #1f1f1f);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  [data-theme="light"] .drawer-logo {
    color: rgba(0, 0, 0, 0.88);
    background: #ffffff;
    border-bottom: 1px solid #f0f0f0;
  }

  /* -------- Header -------- */
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height-mobile);
    line-height: normal;
    padding: 0 var(--space-md);
    background: var(--ant-layout-header-bg);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    z-index: 9;
    padding-left: max(var(--space-md), var(--safe-left));
    padding-right: max(var(--space-md), var(--safe-right));
  }

  /* -------- Header Left -------- */
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    flex-shrink: 0;
  }

  .trigger {
    font-size: var(--text-lg);
    flex-shrink: 0;
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }

  .breadcrumb {
    margin-left: var(--space-sm);
    overflow: hidden;
    white-space: nowrap;
  }

  /* -------- Header Right -------- */
  .header-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .user-info {
    font-size: var(--text-base);
  }

  .user-name {
    white-space: nowrap;
  }

  /* -------- Content -------- */
  .app-layout-main {
    overflow: hidden;
    min-width: 0;
  }

  .app-content {
    min-width: 0;
    padding: var(--space-md);
    overflow-x: auto;
    background: var(--ant-layout-body-bg);
  }

  .content-inner {
    min-width: 0;
    margin: 0;
    padding: var(--space-md);
    border-radius: 8px;
    min-height: 280px;
    overflow-x: auto;
    background: var(--ant-layout-body-bg);
  }

  /* ==========================================
   平板 (≥ 576px)
   ========================================== */
  @media (min-width: 576px) {
    .app-content {
      padding: var(--space-lg);
    }

    .content-inner {
      padding: var(--space-lg);
    }
  }

  /* ==========================================
   平板 (≥ 768px)
   ========================================== */
  @media (min-width: 768px) {
    .logo {
      height: var(--header-height-tablet);
    }

    .app-header {
      height: var(--header-height-tablet);
      padding: 0 var(--space-lg);
    }

    .app-content {
      padding: var(--space-xl);
    }

    .content-inner {
      margin: 0;
      padding: var(--space-xl);
    }
  }

  /* ==========================================
   桌面 (≥ 992px)
   ========================================== */
  @media (min-width: 992px) {
    .logo {
      height: var(--header-height-desktop);
    }

    .app-header {
      height: var(--header-height-desktop);
      padding: 0 var(--space-xl);
    }

    .app-content {
      padding: var(--space-xl);
    }

    .content-inner {
      margin: 0 auto;
      max-width: var(--content-max-width);
      padding: var(--space-xl);
    }
  }

  /* ==========================================
   大桌面 (≥ 1200px)
   ========================================== */
  @media (min-width: 1200px) {
    .content-inner {
      max-width: var(--content-max-width-xl);
    }
  }
</style>

<style>
  /* ==========================================
   Toolbar Chip — 全局样式（需穿透 Portal）
   ========================================== */

  .toolbar-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 10px;
    font-size: var(--text-sm);
    border-radius: 18px;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  [data-theme="light"] .toolbar-chip {
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.15);
    color: rgba(0, 0, 0, 0.75);
  }

  [data-theme="light"] .toolbar-chip:hover {
    background: rgba(0, 0, 0, 0.06);
    border-color: #1677ff;
    color: #1677ff;
  }

  [data-theme="dark"] .toolbar-chip {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.85);
  }

  [data-theme="dark"] .toolbar-chip:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #1677ff;
    color: #1677ff;
  }

  .toolbar-chip .chip-icon {
    font-size: var(--text-base);
    flex-shrink: 0;
    color: inherit;
    opacity: 0.65;
  }

  .toolbar-chip:hover .chip-icon {
    opacity: 1;
  }

  .toolbar-chip .chip-label {
    font-weight: 500;
  }

  .toolbar-chip .chip-caret {
    font-size: 1rem;
    opacity: 0.45;
    transition: transform 0.2s ease;
  }

  /* -------- 桌面/平板：Pill 恢复正常尺寸 -------- */
  @media (min-width: 576px) {
    .toolbar-chip {
      height: 32px;
      padding: 0 var(--space-md);
      font-size: var(--text-sm);
      border-radius: 16px;
      gap: var(--space-xs);
    }
  }

  /* ==========================================
   移动端导航抽屉 — 暗色统一为中性深灰
   ========================================== */

  [data-theme="dark"] .app-nav-drawer .ant-menu-dark {
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    border-inline-end: none;
  }

  [data-theme="dark"] .app-nav-drawer .ant-menu-dark .ant-menu-item {
    color: rgba(255, 255, 255, 0.75);
  }

  [data-theme="dark"] .app-nav-drawer .ant-menu-dark .ant-menu-item:hover,
  [data-theme="dark"] .app-nav-drawer .ant-menu-dark .ant-menu-item-active {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  [data-theme="dark"] .app-nav-drawer .ant-menu-dark .ant-menu-item-selected {
    background: #1677ff;
    color: #ffffff;
  }
</style>
