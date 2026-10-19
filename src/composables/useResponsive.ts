import { computed, reactive, toRefs } from 'vue';
import { Grid } from 'ant-design-vue';

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

const { useBreakpoint } = Grid;

export function useResponsive() {
  const screens = useBreakpoint();

  const breakpoint = computed<BreakpointKey>(() => {
    const bp = screens.value;
    if (bp.xxl) return 'xxl';
    if (bp.xl) return 'xl';
    if (bp.lg) return 'lg';
    if (bp.md) return 'md';
    if (bp.sm) return 'sm';
    return 'xs';
  });

  const state = reactive({
    isMobile: computed(() => breakpoint.value === 'xs'),
    isTablet: computed(
      () => breakpoint.value === 'sm' || breakpoint.value === 'md'
    ),
    isDesktop: computed(() =>
      ['lg', 'xl', 'xxl'].includes(breakpoint.value)
    ),
    isLargeDesktop: computed(() =>
      ['xl', 'xxl'].includes(breakpoint.value)
    ),
    breakpoint,
  });

  return toRefs(state);
}
