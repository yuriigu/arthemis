<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import type { MetricCardProps } from '$lib/components/ui/card/types';

  let { label, value, change, period, positive }: MetricCardProps = $props();
</script>

<!-- Usando Card do shadcn -->
<Card.Root class="metric-card">
  <Card.Content class="metric-content">
    <div class="metric-header">
      <span class="metric-label">{label}:</span>
      <!-- Seta de tendência ao lado do label -->
      <span class="trend-arrow" class:up={positive} class:down={!positive}>
        {#if positive}
          <!-- Seta pra cima -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 17L17 7M17 7H7M17 7V17"/>
          </svg>
        {:else}
          <!-- Seta pra baixo -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 7l10 10M17 7v10H7"/>
          </svg>
        {/if}
      </span>
    </div>

    <!-- Valor principal em destaque -->
    <div class="metric-value">{value}</div>

    <!-- Variação percentual com cor condicional -->
    <div class="metric-change" class:positive class:negative={!positive}>
      {change} {period}
    </div>
  </Card.Content>
</Card.Root>

<style>
  /* :global() permite estilizar elementos de componentes externos como o shadcn */
  :global(.metric-card) {
    min-width: 180px;
    border-radius: 12px !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
  }

  :global(.metric-content) {
    padding: 16px 20px !important;
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .metric-label {
    font-size: 14px;
    color: var(--foreground) !important;
    font-weight: 500;
  }

  .trend-arrow.up  { color: #16a34a; }
  .trend-arrow.down { color: #dc2626; }

  .metric-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--foreground) !important;
    margin-bottom: 4px;
    letter-spacing: -1px;
  }

  .metric-change {
    font-size: 14px;
    font-weight: 500;
  }

  .metric-change.positive  { color: #22c55e; }
  .metric-change.negative  { color: #ef4444; }
</style>
