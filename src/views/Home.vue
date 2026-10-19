<template>
  <div class="home-page">

    <Row :gutter="[16, 16]">
      <Col v-for="stat in stats" :key="stat.title" :xs="24" :sm="12" :lg="6">
        <Card hoverable>
          <div class="stat-card">
            <div class="stat-info">
              <span class="stat-title">{{ stat.title }}</span>
              <span class="stat-value">
                {{ stat.prefix }}{{ stat.value.toLocaleString() }}{{ stat.suffix }}
              </span>
              <span class="stat-growth" :style="{ color: stat.growth > 0 ? '#52c41a' : '#ff4d4f' }">
                <ArrowUpOutlined v-if="stat.growth > 0" />
                <ArrowDownOutlined v-else />
                {{ Math.abs(stat.growth) }}%
              </span>
            </div>
            <div class="stat-icon" :style="{ backgroundColor: stat.color + '20', color: stat.color }">
              <component :is="stat.icon" />
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]" style="margin-top: 16px">
      <Col :xs="24" :lg="16">
        <Card :title="t('home.recentOrders')">
          <Table :columns="columns" :data-source="recentOrders" :pagination="{ pageSize: 5 }"
            :scroll="{ x: 'max-content' }" row-key="id" size="small" />
        </Card>
      </Col>
      <Col :xs="24" :lg="8">
        <Card :title="t('home.performance')">
          <div class="performance-list">
            <div class="performance-item">
              <div class="perf-header">
                <span>{{ t('home.cpuUsage') }}</span>
                <span class="perf-value">{{ perfMetrics.fps }} fps</span>
              </div>
              <Progress :percent="perfMetrics.fpsPercent" :stroke-color="{ from: '#108ee9', to: '#87d068' }" />
            </div>
            <div class="performance-item">
              <div class="perf-header">
                <span>{{ t('home.memoryUsage') }}</span>
                <span class="perf-value">{{ perfMetrics.memoryUsed }} MB</span>
              </div>
              <Progress :percent="perfMetrics.memoryPercent" status="active" />
            </div>
            <div class="performance-item">
              <div class="perf-header">
                <span>{{ t('home.domNodes') }}</span>
                <Tag :color="perfMetrics.domStatusColor">{{ perfMetrics.domNodes }}</Tag>
              </div>
            </div>
            <div class="performance-item">
              <div class="perf-header">
                <span>{{ t('home.pageLoadTime') }}</span>
                <Tag :color="perfMetrics.pageLoadColor">{{ perfMetrics.pageLoadTime }} ms</Tag>
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
  defineOptions({
    name: 'HomePage'
  });
  import { ref, computed, reactive, h, onMounted, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { Row, Col, Card, Table, Tag, Progress } from 'ant-design-vue';
  import {
    UserOutlined,
    ShoppingOutlined,
    DollarOutlined,
    RiseOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
  } from '@ant-design/icons-vue';

  const { t } = useI18n();

  const stats = computed(() => [
    { title: t('sidebar.users'), value: 12846, icon: UserOutlined, color: '#1890ff', growth: 12.5 },
    {
      title: t('sidebar.orders'),
      value: 3842,
      icon: ShoppingOutlined,
      color: '#52c41a',
      growth: -3.2
    },
    {
      title: t('home.revenue'),
      value: 89760,
      prefix: '$',
      icon: DollarOutlined,
      color: '#faad14',
      growth: 8.1
    },
    {
      title: t('home.growth'),
      value: 23.6,
      suffix: '%',
      icon: RiseOutlined,
      color: '#722ed1',
      growth: 5.7
    }
  ]);

  const recentOrders = ref([
    { id: '1001', customer: 'John Doe', product: 'Laptop Pro', amount: 1299, status: 'completed' },
    {
      id: '1002',
      customer: 'Jane Smith',
      product: 'Wireless Mouse',
      amount: 49,
      status: 'pending'
    },
    {
      id: '1003',
      customer: 'Mike Johnson',
      product: 'Monitor 27"',
      amount: 399,
      status: 'completed'
    },
    { id: '1004', customer: 'Sarah Wilson', product: 'Keyboard', amount: 89, status: 'processing' },
    { id: '1005', customer: 'Tom Brown', product: 'Headphones', amount: 159, status: 'completed' }
  ]);

  const columns = computed(() => [
    { title: t('home.orderId'), dataIndex: 'id', key: 'id' },
    { title: t('home.customer'), dataIndex: 'customer', key: 'customer' },
    { title: t('home.product'), dataIndex: 'product', key: 'product' },
    {
      title: t('home.amount'),
      dataIndex: 'amount',
      key: 'amount',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRender: ({ text }: any) => `$${text}`
    },
    {
      title: t('home.status'),
      dataIndex: 'status',
      key: 'status',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customRender: ({ text }: any) => {
        const colors: Record<string, string> = {
          completed: 'green',
          pending: 'orange',
          processing: 'blue'
        };
        const statusLabels: Record<string, string> = {
          completed: t('home.completed'),
          pending: t('home.pending'),
          processing: t('home.processing')
        };
        return h(Tag, { color: colors[text] || 'default' }, () => statusLabels[text] || text);
      }
    }
  ]);

  const perfMetrics = reactive({
    fps: 60,
    fpsPercent: 100,
    memoryUsed: 0,
    memoryPercent: 0,
    domNodes: 0,
    domStatusColor: 'green' as string,
    pageLoadTime: 0,
    pageLoadColor: 'green' as string
  });

  let rafId = 0;
  let lastTime = performance.now();
  let frameCount = 0;

  function measureFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      perfMetrics.fps = Math.min(fps, 60);
      perfMetrics.fpsPercent = Math.round((perfMetrics.fps / 60) * 100);
      frameCount = 0;
      lastTime = now;
    }
    rafId = requestAnimationFrame(measureFPS);
  }

  function measureMemory() {
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
    ).memory;
    if (memory) {
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      perfMetrics.memoryUsed = Math.round(usedMB);
      perfMetrics.memoryPercent = Math.round((usedMB / limitMB) * 100);
    } else {
      perfMetrics.memoryUsed = 0;
      perfMetrics.memoryPercent = 0;
    }
  }

  function measureDOMNodes() {
    const count = document.querySelectorAll('*').length;
    perfMetrics.domNodes = count;
    if (count < 1000) {
      perfMetrics.domStatusColor = 'green';
    } else if (count < 2000) {
      perfMetrics.domStatusColor = 'orange';
    } else {
      perfMetrics.domStatusColor = 'red';
    }
  }

  function measurePageLoadTime() {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (entries.length > 0 && entries[0]) {
      const nav = entries[0];
      if (nav.loadEventEnd === 0) return;
      const loadTime = nav.loadEventEnd - nav.startTime;
      perfMetrics.pageLoadTime = Math.round(loadTime);
      if (loadTime < 2000) {
        perfMetrics.pageLoadColor = 'green';
      } else if (loadTime < 4000) {
        perfMetrics.pageLoadColor = 'orange';
      } else {
        perfMetrics.pageLoadColor = 'red';
      }
    }
  }

  let perfTimer: ReturnType<typeof setInterval>;

  onMounted(() => {
    measureFPS();
    measureMemory();
    measureDOMNodes();
    measurePageLoadTime();
    perfTimer = setInterval(() => {
      measureMemory();
      measureDOMNodes();
    }, 2000);
  });

  onUnmounted(() => {
    cancelAnimationFrame(rafId);
    clearInterval(perfTimer);
  });
</script>

<style scoped>
  .home-page {
    max-width: 1400px;
    min-width: 0;
  }

  /* 移动端：允许 Card 收缩，让表格在白色卡片内部横向滚动 */
  .home-page :deep(.ant-card) {
    min-width: 0;
  }

  .home-page :deep(.ant-table-content),
  .home-page :deep(.ant-table-body) {
    overflow-x: auto;
  }

  .stat-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-title {
    font-size: 1.3rem;
    color: #8c8c8c;
  }

  .stat-value {
    font-size: 2.8rem;
    font-weight: 600;
    line-height: 1.2;
  }

  .stat-growth {
    font-size: 1.3rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
  }

  .performance-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .performance-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .perf-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .perf-header span:first-child {
    font-size: 1.3rem;
    color: #8c8c8c;
  }

  .perf-value {
    font-size: 1.2rem;
    color: #1890ff;
    font-weight: 500;
  }
</style>
