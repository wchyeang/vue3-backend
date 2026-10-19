<template>
  <div class="not-found">
    <Result status="404" :title="t('notFound.title')" :sub-title="t('notFound.subtitle')">
      <template #extra>
        <Button type="primary" @click="router.push('/')">
          {{ t('notFound.backHome') }}
        </Button>
      </template>
    </Result>
  </div>
</template>

<script setup lang="ts">
  defineOptions({
    name: 'NotFoundPage'
  });
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { Result, Button } from 'ant-design-vue';

  const { t } = useI18n();
  const router = useRouter();
</script>

<style scoped>
  .not-found {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }
</style>
