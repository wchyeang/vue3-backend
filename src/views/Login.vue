<template>
  <div class="login" :data-theme="themeStore.isDark ? 'dark' : 'light'">
    <!-- 右上浮层工具栏：明暗切换 + 中英文切换 -->
    <div class="login-toolbar">
      <div class="toolbar-glass">
        <Dropdown :trigger="['hover']">
          <span class="lang-chip">
            <GlobalOutlined class="chip-icon" />
            <span class="chip-label">{{ localeLabel }}</span>
            <CaretDownOutlined class="chip-caret" />
          </span>
          <template #overlay>
            <Menu :selectedKeys="[locale]" @click="handleLocaleMenuClick" class="lang-dropdown">
              <Menu.Item key="zh-CN">{{ t('language.zhCN') }}</Menu.Item>
              <Menu.Item key="en-US">{{ t('language.enUS') }}</Menu.Item>
            </Menu>
          </template>
        </Dropdown>
        <Switch :checked="themeStore.isDark" checked-children="🌙" un-checked-children="☀️"
          @change="themeStore.toggleTheme" />
      </div>
    </div>

    <!-- 动态背景光球 @from react-backend Login.module.scss -->
    <div class="bg-orbs">
      <div class="bg-orb bg-orb-1" />
      <div class="bg-orb bg-orb-2" />
      <div class="bg-orb bg-orb-3" />
      <div class="bg-orb bg-orb-4" />
      <div class="bg-orb bg-orb-5" />
    </div>

    <!-- 粒子光点 -->
    <div class="particles">
      <i v-for="n in 20" :key="n" :class="['particle', `particle-${n}`]" />
    </div>

    <!-- 左侧品牌区 -->
    <div class="login-left">
      <div class="brand-content">
        <div class="brand-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="14" fill="url(#logoGrad)" />
            <path d="M14 28L21 21L27 27L34 18" stroke="#fff" stroke-width="2.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <circle cx="34" cy="18" r="3" fill="#fff" fill-opacity="0.3" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                <stop stop-color="#4f8cff" />
                <stop offset="1" stop-color="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="brand-name">{{ t('login.title') }}</h1>
        <p class="brand-desc">{{ t('login.brandDesc') }}</p>
        <p class="brand-tagline">{{ t('login.brandTagline') }}</p>
      </div>
    </div>

    <!-- 右侧毛玻璃登录卡片 -->
    <div class="login-right">
      <div class="glass-card">
        <div class="card-header">
          <h2 class="login-title">{{ t('login.welcome') }}</h2>
          <p class="login-subtitle">{{ t('login.subtitle') }}</p>
        </div>

        <Form ref="formRef" :model="formState" :rules="rules" auto-complete="off" class="login-form"
          @finish="handleLogin">
          <Form.Item name="username">
            <Input v-model:value="formState.username" size="large" :placeholder="t('login.usernamePlaceholder')"
              autocomplete="username" class="glass-input" :disabled="loading">
              <template #prefix>
                <UserOutlined />
              </template>
            </Input>
          </Form.Item>

          <Form.Item name="password">
            <Input.Password v-model:value="formState.password" size="large" autocomplete="current-password"
              :placeholder="t('login.passwordPlaceholder')" class="glass-input" :disabled="loading"
              @keydown.enter="handleLogin">
              <template #prefix>
                <LockOutlined />
              </template>
            </Input.Password>
          </Form.Item>

          <div class="form-row">
            <Form.Item noStyle>
              <Checkbox v-model:checked="remember" :disabled="loading">{{ t('login.remember') }}</Checkbox>
            </Form.Item>
            <a class="forgot-link">{{ t('login.forgot') }}</a>
          </div>

          <Form.Item>
            <Button type="primary" html-type="submit" size="large" block :loading="loading" :disabled="loading"
              class="submit-btn">
              {{ t('login.submit') }}
            </Button>
          </Form.Item>

          <div v-if="isMockMode" class="demo-hint">{{ t('login.demoHint') }}</div>
        </Form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({
    name: 'LoginPage'
  });
  import { ref, reactive, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { useLocalStorage } from '@vueuse/core';
  import type { Rule } from 'ant-design-vue/es/form';
  import { Form, Input, Button, Checkbox, Dropdown, Menu, Switch, message } from 'ant-design-vue';
  import { UserOutlined, LockOutlined, GlobalOutlined, CaretDownOutlined } from '@ant-design/icons-vue';
  import { useThemeStore } from '@/stores/theme';
  import { useAuthStore } from '@/stores/auth';

  const { t, locale } = useI18n();
  const router = useRouter();
  const themeStore = useThemeStore();
  const authStore = useAuthStore();

  const isMockMode = import.meta.env.VITE_USE_MOCK === 'true';

  const formRef = ref();
  const loading = ref(false);

  const remember = useLocalStorage('login_remember', true);

  const formState = reactive({
    username: '',
    password: '',
  });

  const rules = computed<Record<string, Rule[]>>(() => ({
    username: [{ required: true, message: t('login.usernamePlaceholder'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.passwordPlaceholder'), trigger: 'blur' }]
  }));

  const localeLabels: Record<string, string> = {
    'zh-CN': '中文',
    'en-US': 'EN',
  };
  const localeLabel = computed(() => localeLabels[locale.value] || locale.value);

  function handleLocaleMenuClick(info: { key: string | number }) {
    locale.value = String(info.key);
  }

  async function handleLogin() {
    if (loading.value) return;
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    loading.value = true;
    try {
      await authStore.login({
        username: formState.username,
        password: formState.password
      });
      message.success(t('login.success'));
      router.push('/');
    } catch {
      // 错误提示由全局兜底处理
    } finally {
      loading.value = false;
    }
  }
</script>

<style scoped>

  /* ========== 全屏容器 @from react-backend .login ========== */
  .login {
    position: relative;
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #080c14;
    color: #fff;
  }

  /* ========== 右上浮层工具栏（明暗 + 中英切换） ========== */
  .login-toolbar {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 3;
  }

  .toolbar-glass {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }

  .lang-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    font-size: 13px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .lang-chip:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #1677ff;
    color: #1677ff;
  }

  .lang-chip .chip-icon {
    font-size: 14px;
    flex-shrink: 0;
    color: inherit;
    opacity: 0.65;
  }

  .lang-chip:hover .chip-icon {
    opacity: 1;
  }

  .lang-chip .chip-label {
    font-weight: 500;
  }

  .lang-chip .chip-caret {
    font-size: 12px;
    opacity: 0.45;
    transition: transform 0.2s ease;
  }

  /* 语言下拉弹层：暗色模式下保证选中项可见（跟随全局 documentElement data-theme） */
  :global(html[data-theme='dark'] .lang-dropdown) {
    background: rgba(23, 27, 35, 0.96) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
  }

  :global(html[data-theme='dark'] .lang-dropdown .ant-dropdown-menu-item) {
    color: rgba(255, 255, 255, 0.85) !important;
  }

  :global(html[data-theme='dark'] .lang-dropdown .ant-dropdown-menu-item-selected) {
    background: rgba(99, 102, 241, 0.35) !important;
    color: #fff !important;
    font-weight: 600;
  }

  :global(html[data-theme='dark'] .lang-dropdown .ant-dropdown-menu-item:hover) {
    background: rgba(255, 255, 255, 0.1) !important;
  }

  /* ========== 背景光球 @from react-backend .bgOrbs ========== */
  .bg-orbs {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .bg-orb {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
  }

  .bg-orb-1 {
    width: 520px;
    height: 520px;
    top: -20%;
    left: -8%;
    background: radial-gradient(circle at 40% 40%,
        rgba(59, 130, 246, 0.9),
        rgba(37, 99, 235, 0.4) 50%,
        transparent 70%);
    filter: blur(70px);
    animation: orbDrift1 12s ease-in-out infinite;
  }

  .bg-orb-2 {
    width: 420px;
    height: 420px;
    top: 15%;
    right: -5%;
    background: radial-gradient(circle at 50% 50%,
        rgba(139, 92, 246, 0.85),
        rgba(236, 72, 153, 0.35) 55%,
        transparent 72%);
    filter: blur(50px);
    animation: orbDrift2 14s ease-in-out infinite;
    animation-delay: -4s;
  }

  .bg-orb-3 {
    width: 380px;
    height: 380px;
    bottom: -15%;
    right: 15%;
    background: radial-gradient(circle at 50% 40%,
        rgba(6, 182, 212, 0.8),
        rgba(59, 130, 246, 0.35) 55%,
        transparent 70%);
    filter: blur(60px);
    animation: orbDrift3 15s ease-in-out infinite;
    animation-delay: -8s;
  }

  .bg-orb-4 {
    width: 320px;
    height: 320px;
    bottom: 10%;
    left: -5%;
    background: radial-gradient(circle at 50% 50%,
        rgba(245, 158, 11, 0.65),
        rgba(239, 68, 68, 0.3) 55%,
        transparent 70%);
    filter: blur(80px);
    animation: orbDrift4 16s ease-in-out infinite;
    animation-delay: -10s;
  }

  /* 卡片正后方：不模糊，让毛玻璃 backdrop-filter 生效 @from react-backend .bgOrb5 */
  .bg-orb-5 {
    width: 340px;
    height: 340px;
    top: 20%;
    right: 0;
    background: radial-gradient(circle at 50% 50%,
        rgba(99, 102, 241, 0.7),
        rgba(139, 92, 246, 0.3) 55%,
        transparent 70%);
    filter: blur(0px);
    animation: orbDrift5 10s ease-in-out infinite;
    animation-delay: -2s;
  }

  @keyframes orbDrift1 {

    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    33% {
      transform: translate(35px, 25px) scale(1.1);
    }

    66% {
      transform: translate(-18px, -12px) scale(0.94);
    }
  }

  @keyframes orbDrift2 {

    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    33% {
      transform: translate(-45px, -20px) scale(1.08);
    }

    66% {
      transform: translate(25px, 35px) scale(0.93);
    }
  }

  @keyframes orbDrift3 {

    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    33% {
      transform: translate(-25px, -35px) scale(1.12);
    }

    66% {
      transform: translate(35px, 18px) scale(0.93);
    }
  }

  @keyframes orbDrift4 {

    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    33% {
      transform: translate(50px, -15px) scale(1.06);
    }

    66% {
      transform: translate(-35px, -25px) scale(0.96);
    }
  }

  @keyframes orbDrift5 {

    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }

    50% {
      transform: translate(-22px, -18px) scale(1.18);
    }
  }

  /* ========== 光点粒子 @from react-backend .particles ========== */
  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }

  .particle {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #fff;
    box-shadow:
      0 0 4px 1px rgba(255, 255, 255, 0.5),
      0 0 10px 3px rgba(147, 197, 253, 0.3);
    animation: particleFloat 5s ease-in-out infinite;
  }

  /* 20 个粒子固定位置/尺寸/动画（@from react-backend $particle-positions） */
  .particle-1 {
    left: 8%;
    top: 12%;
    width: 6px;
    height: 6px;
    animation-delay: -0.3s;
    animation-duration: 7s;
  }

  .particle-2 {
    left: 22%;
    top: 6%;
    width: 4px;
    height: 4px;
    animation-delay: -0.6s;
    animation-duration: 5s;
  }

  .particle-3 {
    left: 40%;
    top: 85%;
    width: 5px;
    height: 5px;
    animation-delay: -0.9s;
    animation-duration: 8s;
  }

  .particle-4 {
    left: 55%;
    top: 10%;
    width: 3px;
    height: 3px;
    animation-delay: -1.2s;
    animation-duration: 6s;
  }

  .particle-5 {
    left: 72%;
    top: 72%;
    width: 6px;
    height: 6px;
    animation-delay: -1.5s;
    animation-duration: 7s;
  }

  .particle-6 {
    left: 85%;
    top: 5%;
    width: 4px;
    height: 4px;
    animation-delay: -1.8s;
    animation-duration: 5s;
  }

  .particle-7 {
    left: 93%;
    top: 88%;
    width: 5px;
    height: 5px;
    animation-delay: -2.1s;
    animation-duration: 6s;
  }

  .particle-8 {
    left: 12%;
    top: 55%;
    width: 3px;
    height: 3px;
    animation-delay: -2.4s;
    animation-duration: 7s;
  }

  .particle-9 {
    left: 28%;
    top: 40%;
    width: 5px;
    height: 5px;
    animation-delay: -2.7s;
    animation-duration: 5s;
  }

  .particle-10 {
    left: 48%;
    top: 60%;
    width: 4px;
    height: 4px;
    animation-delay: -3s;
    animation-duration: 8s;
  }

  .particle-11 {
    left: 62%;
    top: 35%;
    width: 6px;
    height: 6px;
    animation-delay: -3.3s;
    animation-duration: 6s;
  }

  .particle-12 {
    left: 78%;
    top: 50%;
    width: 3px;
    height: 3px;
    animation-delay: -3.6s;
    animation-duration: 7s;
  }

  .particle-13 {
    left: 88%;
    top: 25%;
    width: 5px;
    height: 5px;
    animation-delay: -3.9s;
    animation-duration: 5s;
  }

  .particle-14 {
    left: 15%;
    top: 78%;
    width: 4px;
    height: 4px;
    animation-delay: -4.2s;
    animation-duration: 6s;
  }

  .particle-15 {
    left: 35%;
    top: 22%;
    width: 6px;
    height: 6px;
    animation-delay: -4.5s;
    animation-duration: 8s;
  }

  .particle-16 {
    left: 52%;
    top: 92%;
    width: 3px;
    height: 3px;
    animation-delay: -4.8s;
    animation-duration: 5s;
  }

  .particle-17 {
    left: 68%;
    top: 18%;
    width: 5px;
    height: 5px;
    animation-delay: -5.1s;
    animation-duration: 7s;
  }

  .particle-18 {
    left: 82%;
    top: 65%;
    width: 4px;
    height: 4px;
    animation-delay: -5.4s;
    animation-duration: 6s;
  }

  .particle-19 {
    left: 8%;
    top: 32%;
    width: 6px;
    height: 6px;
    animation-delay: -5.7s;
    animation-duration: 5s;
  }

  .particle-20 {
    left: 95%;
    top: 45%;
    width: 3px;
    height: 3px;
    animation-delay: -6s;
    animation-duration: 7s;
  }

  @keyframes particleFloat {

    0%,
    100% {
      transform: translateY(0) scale(1);
      opacity: 0.3;
    }

    30% {
      transform: translateY(-18px) scale(1.6);
      opacity: 0.9;
    }

    60% {
      transform: translateY(10px) scale(0.7);
      opacity: 0.2;
    }

    80% {
      transform: translateY(-6px) scale(1.2);
      opacity: 0.6;
    }
  }

  /* ========== 左侧品牌区 — 55% @from react-backend .loginLeft ========== */
  .login-left {
    position: relative;
    z-index: 2;
    flex: 0 0 55%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px;
  }

  .brand-content {
    text-align: center;
    animation: brandEnter 0.8s ease-out;
  }

  .brand-logo {
    width: 56px;
    height: 56px;
    margin: 0 auto 24px;
    filter: drop-shadow(0 8px 24px rgba(79, 140, 255, 0.4));
  }

  .brand-logo svg {
    width: 100%;
    height: 100%;
  }

  .brand-name {
    margin: 0 0 1.2rem;
    font-size: 3.6rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .brand-desc {
    margin: 0 0 16px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 1px;
  }

  .brand-tagline {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.28);
    line-height: 1.6;
  }

  @keyframes brandEnter {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* ========== 右侧表单区 — 45% @from react-backend .loginRight ========== */
  .login-right {
    position: relative;
    z-index: 2;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  /* ========== 毛玻璃卡片 @from react-backend .glassCard ========== */
  .glass-card {
    position: relative;
    width: 420px;
    max-width: 100%;
    padding: 44px 40px;
    border-radius: 20px;

    /* 毛玻璃核心 */
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(30px) saturate(200%);
    -webkit-backdrop-filter: blur(30px) saturate(200%);

    /* 玻璃边框 + 顶部高光 */
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.03);

    /* 入场动画 */
    animation: cardEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: 0.15s;

    /* hover 微悬浮 */
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  }

  @keyframes cardEnter {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* ========== 卡片头部 ========== */
  .card-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .login-title {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
  }

  .login-subtitle {
    margin: 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* ========== 表单项 stagger 入场 ========== */
  .login-form :deep(> *) {
    animation: itemEnter 0.5s ease-out both;
  }

  .login-form :deep(> *:nth-child(1)) {
    animation-delay: 0.3s;
  }

  .login-form :deep(> *:nth-child(2)) {
    animation-delay: 0.4s;
  }

  .login-form :deep(> *:nth-child(3)) {
    animation-delay: 0.5s;
  }

  .login-form :deep(> *:nth-child(4)) {
    animation-delay: 0.6s;
  }

  @keyframes itemEnter {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 毛玻璃输入框 ========== */
  .glass-input {
    background: rgba(255, 255, 255, 0.07) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 12px !important;
    color: #fff !important;
    transition: all 0.3s ease !important;
  }

  .glass-input :deep(input) {
    background: transparent !important;
    color: inherit !important;
  }

  .glass-input :deep(input::placeholder) {
    color: rgba(255, 255, 255, 0.3) !important;
  }

  .glass-input :deep(.ant-input-prefix) {
    color: rgba(255, 255, 255, 0.35) !important;
  }

  .glass-input:hover,
  .glass-input:focus-within {
    border-color: rgba(99, 102, 241, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12) !important;
    transform: scale(1.01);
  }

  .login-form :deep(.ant-form-item-explain-error) {
    color: #ff7875;
  }

  /* ========== 表单行 @from react-backend .formRow ========== */
  .form-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .form-row :deep(.ant-form-item) {
    margin-bottom: 0;
  }

  .form-row :deep(.ant-checkbox-wrapper) {
    color: rgba(255, 255, 255, 0.55) !important;
  }

  .form-row :deep(.ant-checkbox-inner) {
    box-shadow: none !important;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .form-row :deep(.ant-checkbox-input:focus-visible + .ant-checkbox-inner) {
    outline: none !important;
    box-shadow: none !important;
  }

  .form-row :deep(.ant-checkbox-checked .ant-checkbox-inner) {
    background: #1677ff;
    border-color: #1677ff;
  }

  .forgot-link {
    font-size: 12px;
    color: rgba(129, 140, 248, 0.9);
    text-decoration: none;
    transition: color 0.2s;
  }

  .forgot-link:hover {
    color: #a5b4fc;
  }

  /* ========== 提交按钮 ========== */
  .submit-btn {
    height: 48px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    border: none !important;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    transition: all 0.3s ease;
  }

  .submit-btn:hover {
    background: linear-gradient(135deg, #818cf8, #a78bfa) !important;
    box-shadow: 0 6px 28px rgba(99, 102, 241, 0.55);
    transform: translateY(-1px);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  /* ========== 响应式：≤1024px 上下堆叠，品牌区变顶部紧凑条 ========== */
  @media (max-width: 1024px) {
    .login {
      flex-direction: column;
      justify-content: center;
    }

    .login-left {
      flex: 0 0 auto;
      padding: 2.4rem 2.4rem 0;
    }

    .brand-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.2rem;
    }

    .brand-logo {
      width: 3.6rem;
      height: 3.6rem;
      margin: 0;
    }

    .brand-name {
      margin: 0;
    }

    .brand-desc {
      display: none;
    }

    .brand-tagline {
      display: none;
    }

    .login-right {
      flex: 0 0 auto;
      padding: 1.2rem 2.4rem 2.4rem;
    }

    .glass-card {
      width: 100%;
      max-width: 42rem;
      padding: 3.6rem 2.8rem;
    }
  }

  /* ========== 响应式：≤768px 进一步紧凑 ========== */
  @media (max-width: 768px) {
    .login-left {
      padding: 1.6rem 1.6rem 0;
    }

    .brand-logo {
      width: 2.8rem;
      height: 2.8rem;
    }

    .login-right {
      padding: 1.6rem;
    }

    .glass-card {
      padding: 2.8rem 2rem;
    }
  }

  /* ==========================================
     明亮模式 @from react-backend [data-theme='light']
     ========================================== */
  .login[data-theme='light'] {
    background: #e8ecf1;
    color: #0f172a;
  }

  /* 粒子 */
  .login[data-theme='light'] .particle {
    background: rgba(37, 99, 235, 0.7);
    box-shadow:
      0 0 4px 1px rgba(37, 99, 235, 0.3),
      0 0 8px 2px rgba(37, 99, 235, 0.15);
  }

  /* 品牌文字 */
  .login[data-theme='light'] .brand-name,
  .login[data-theme='light'] .login-title {
    color: #0f172a;
  }

  .login[data-theme='light'] .brand-desc {
    color: rgba(15, 23, 42, 0.45);
  }

  .login[data-theme='light'] .brand-tagline {
    color: rgba(15, 23, 42, 0.3);
  }

  .login[data-theme='light'] .login-subtitle {
    color: rgba(15, 23, 42, 0.4);
  }

  /* 毛玻璃卡片 */
  .login[data-theme='light'] .glass-card {
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  .login[data-theme='light'] .glass-card:hover {
    box-shadow:
      0 16px 48px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  }

  /* 玻璃输入框 */
  .login[data-theme='light'] .glass-input {
    background: rgba(0, 0, 0, 0.03) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    color: #0f172a !important;
  }

  .login[data-theme='light'] .glass-input :deep(input::placeholder) {
    color: rgba(0, 0, 0, 0.25) !important;
  }

  .login[data-theme='light'] .glass-input :deep(.ant-input-prefix) {
    color: rgba(0, 0, 0, 0.3) !important;
  }

  /* 记住我 */
  .login[data-theme='light'] .form-row :deep(.ant-checkbox-wrapper) {
    color: rgba(0, 0, 0, 0.5) !important;
  }

  .login[data-theme='light'] .form-row :deep(.ant-checkbox-inner) {
    box-shadow: none !important;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.25);
  }

  .login[data-theme='light'] .form-row :deep(.ant-checkbox-input:focus-visible + .ant-checkbox-inner) {
    outline: none !important;
    box-shadow: none !important;
  }

  .login[data-theme='light'] .form-row :deep(.ant-checkbox-checked .ant-checkbox-inner) {
    background: #1677ff;
    border-color: #1677ff;
  }

  /* 工具栏 */
  .login[data-theme='light'] .toolbar-glass {
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .login[data-theme='light'] .lang-chip {
    border-color: rgba(0, 0, 0, 0.15);
    color: rgba(0, 0, 0, 0.75);
  }

  .login[data-theme='light'] .lang-chip:hover {
    background: rgba(0, 0, 0, 0.06);
    border-color: #1677ff;
    color: #1677ff;
  }

  /* ========== 演示账号提示 ========== */
  .demo-hint {
    margin-top: 16px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.25);
    text-align: center;
    font-size: 12px;
    color: rgba(165, 180, 252, 0.9);
  }

  .login[data-theme='light'] .demo-hint {
    background: rgba(99, 102, 241, 0.06);
    border-color: rgba(99, 102, 241, 0.2);
    color: #6366f1;
  }
</style>
