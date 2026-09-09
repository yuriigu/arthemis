<script lang="ts">
	import { Arc, PieChart, Text } from 'layerchart';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { PieChartProps } from '$lib/components/ui/chart/types';

	let {
		title,
		description,
		slices,
		footerTitle,
		footerDescription,
		class: className
	}: PieChartProps = $props();

	// Transforma as slices no formato esperado pelo PieChart
	const chartData = $derived(slices.map(s => ({
		name: s.label,
		value: s.value,
		color: s.color
	})));

	// Gera a configuração do gráfico dinamicamente para o Tooltip e Container
	const chartConfig = $derived(
		slices.reduce((acc, slice) => {
			acc[slice.label.toLowerCase()] = {
				label: slice.label,
				color: slice.color
			};
			return acc;
		}, {} as Chart.ChartConfig)
	);
</script>

<Card.Root class="flex flex-col {className}">
	<Card.Header class="items-center">
		<Card.Title>{title}</Card.Title>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
		<div class="legend">
			{#each slices as slice (slice.label)}
				<span class="legend-item">
					<span class="legend-dot" style="background:{slice.color}"></span>
					{slice.label}
				</span>
			{/each}
		</div>
	</Card.Header>
	<Card.Content class="flex-1">
		<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-62.5">
			<PieChart
				data={chartData}
				key="name"
				value="value"
				cRange={chartData.map((d) => d.color)}
				c="color"
				props={{
					pie: {
						motion: 'tween'
					}
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip hideLabel />
				{/snippet}
				{#snippet arc({ props, visibleData, index })}
					{@const name = visibleData[index].name}
					<Arc {...props}>
						{#snippet children({ getArcTextProps })}
							<Text
								value={name}
								{...getArcTextProps('centroid')}
								font-size="12"
								class="fill-background capitalize"
							/>
						{/snippet}
					</Arc>
				{/snippet}
			</PieChart>
		</Chart.Container>
	</Card.Content>
	{#if footerTitle || footerDescription}
		<Card.Footer class="flex-col gap-2 text-sm">
			{#if footerTitle}
				<div class="flex items-center gap-2 leading-none font-medium">
					{footerTitle} <TrendingUpIcon class="size-4" />
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
	.legend {
		display: flex;
		gap: 20px;
		margin-top: 8px;
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
</style>
