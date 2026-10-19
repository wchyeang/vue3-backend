<template>
  <ConfigProvider :theme="{
    algorithm: themeStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm
  }">
    <div class="login-container" :class="{ dark: themeStore.isDark }">
      <div class="login-toolbar">
        <Space>
          <Select :value="locale" size="small" style="width: 100px" @change="handleLocaleChange">
            <Select.Option value="zh-CN">中文</Select.Option>
            <Select.Option value="en-US">English</Select.Option>
          </Select>
          <Switch :checked="themeStore.isDark" checked-children="🌙" un-checked-children="☀️"
            @change="themeStore.toggleTheme" />
        </Space>
      </div>

      <div class="login-card-wrapper">
        <Card class="login-card" :bordered="false">
          <div class="login-header">
            <Typography.Title :level="2">{{ t('login.title') }}</Typography.Title>
            <Typography.Text type="secondary">{{ t('login.subtitle') }}</Typography.Text>
          </div>

          <Form ref="formRef" :model="formState" :rules="rules" class="login-form" @finish="handleLogin">
            <Form.Item name="username">
              <Input v-model:value="formState.username" size="large" :placeholder="t('login.usernamePlaceholder')">
                <template #prefix>
                  <UserOutlined />
                </template>
              </Input>
            </Form.Item>

            <Form.Item name="password">
              <Input.Password v-model:value="formState.password" size="large"
                :placeholder="t('login.passwordPlaceholder')" @keydown.enter="handleLogin">
                <template #prefix>
                  <LockOutlined />
                </template>
              </Input.Password>
            </Form.Item>

            <Form.Item>
              <div class="login-extra">
                <Checkbox v-model:checked="formState.remember">
                  {{ t('login.remember') }}
                </Checkbox>
              </div>
            </Form.Item>

            <Form.Item>
              <Button type="primary" html-type="submit" size="large" block :loading="loading">
                {{ t('login.submit') }}
              </Button>
            </Form.Item>
          </Form>

          <div class="login-footer">
            <Typography.Text type="secondary"> admin / admin </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  </ConfigProvider>
</template>

<script setup lang="ts">
  defineOptions({
    name: 'LoginPage'
  });
  import { ref, reactive, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import type { Rule } from 'ant-design-vue/es/form';
  import {
    Form,
    Input,
    Button,
    Card,
    Checkbox,
    message,
    Select,
    Switch,
    Space,
    Typography,
    ConfigProvider,
    theme
  } from 'ant-design-vue';
  import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
  import { useThemeStore } from '@/stores/theme';
  import { useAuthStore } from '@/stores/auth';

  const { t, locale } = useI18n();
  const router = useRouter();
  const themeStore = useThemeStore();
  const authStore = useAuthStore();

  const formRef = ref();
  const loading = ref(false);

  const formState = reactive({
    username: '',
    password: '',
    remember: true
  });

  const rules = computed<Record<string, Rule[]>>(() => ({
    username: [{ required: true, message: t('login.usernamePlaceholder'), trigger: 'blur' }],
    password: [{ required: true, message: t('login.passwordPlaceholder'), trigger: 'blur' }]
  }));

  function handleLocaleChange(val: unknown) {
    const value = String(val);
    locale.value = value;
  }

  function handleLogin() {
    formRef.value?.validate().then(async () => {
      loading.value = true;
      try {
        await authStore.login({
          username: formState.username,
          password: formState.password
        });
        message.success(t('login.success'));
        router.push('/');
      } catch {
        message.error(t('login.error'));
      } finally {
        loading.value = false;
      }
    });
  }
</script>

<style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
  }

  .login-container.dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .login-toolbar {
    position: absolute;
    top: 24px;
    right: 24px;
  }

  .login-card-wrapper {
    width: 100%;
    max-width: 400px;
    padding: 0 16px;
  }

  .login-card {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-header h2 {
    margin-bottom: 8px;
  }

  .login-form {
    margin-top: 8px;
  }

  .login-extra {
    display: flex;
    justify-content: flex-start;
  }

  .login-footer {
    text-align: center;
    padding-top: 8px;
  }
</style>
