<script lang="ts">
	import { LineChart } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import { scaleUtc } from 'd3-scale';
	import { curveLinear, curveNatural } from 'd3-shape';
	import { Button } from '$lib/components/ui/button';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { LineChartProps } from '$lib/components/ui/chart/types';

	let {
		title,
		description,
		data,
		series,
		footerTitle,
		footerDescription,
		selectedPeriod,
		periodOptions,
		onPeriodChange,
		class: className,
		dotted = false
	}: LineChartProps = $props();

	// Gera a configuração do gráfico dinamicamente com base nas séries
	const chartConfig = $derived(
		series.reduce((acc, s) => {
			acc[s.key] = {
				label: s.label,
				color: s.color
			};
			return acc;
		}, {} as Chart.ChartConfig)
	);
</script>

<Card.Root class="flex flex-col {className}">
	<Card.Header>
		<div class="header-top">
			<div>
				<Card.Title>{title}</Card.Title>

				{#if description}
					<Card.Description>{description}</Card.Description>
				{/if}
			</div>

			{#if selectedPeriod && periodOptions?.length && onPeriodChange}
				<div class="period-selector">
					{#each periodOptions as period (period)}
						<Button
							variant={selectedPeriod === period ? 'default' : 'secondary'}
							size="sm"
							onclick={() => onPeriodChange(period)}
						>
							{period}
						</Button>
					{/each}
				</div>
			{/if}
		</div>
		<div class="legend">
			{#each series as s (s.key)}
				<span class="legend-item">
					<span class="legend-dot" style="background:{s.color}"></span>
					{s.label}
				</span>
			{/each}
		</div>
	</Card.Header>
	<Card.Content class="flex-1">
		<Chart.Container config={chartConfig} class="min-h-50 w-full">
			<LineChart
				points={{ r: 4 }}
				{data}
				x="date"
				xScale={scaleUtc()}
				axis="x"
				series={series.map((s) => ({
					key: s.key,
					label: s.label,
					color: s.color
				}))}
				props={{
					spline: { curve: dotted ? curveLinear : curveNatural,
						 	  motion: 'tween', 
							  strokeWidth: 2,
						      "stroke-dasharray": dotted ? "6 6" : undefined},
					highlight: {
						points: {
							motion: 'none',
							r: 6
						}
					},
					xAxis: {
						format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short' })
					}
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
			</LineChart>
		</Chart.Container>
	</Card.Content>
	{#if footerTitle || footerDescription}
		<Card.Footer class="flex-col items-start gap-2 text-sm">
			{#if footerTitle}
				<div class="flex items-center gap-2 leading-none font-medium">
					{footerTitle}
					<TrendingUpIcon class="size-4" />
				</div>
			{/if}
			{#if footerDescription}
				<div class="leading-none text-muted-foreground">
					{footerDescription}
				</div>
			{/if}
		</Card.Footer>
	{/if}
</Card.Root>

<style>
	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 16px;
	}

	.period-selector {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		margin-left: auto;
		justify-content: flex-end;
	}

	.legend {
		display: flex;
		gap: 20px;
		margin-top: 8px;
		flex-wrap: wrap;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
    	color: var(--foreground) !important;
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 4px;
	}

	@media (max-width: 768px) {
		.header-top {
			flex-direction: column;
		}
	}
</style>
