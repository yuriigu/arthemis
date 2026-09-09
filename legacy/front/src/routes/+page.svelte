<script lang="ts">
	import MetricCard from '$lib/components/ui/card/MetricCard.svelte';
	import LineChart from '$lib/components/ui/chart/LineChart.svelte';
	import PieChart from '$lib/components/ui/chart/PieChart.svelte';
	import type { DataPoint } from '$lib/components/ui/chart/types';

	import { Button } from '$lib/components/ui/button';

	// Dados por período (simulados)
	const dataByPeriod: Record<string, DataPoint[]> = {
		'1M': [
			{ date: new Date('2024-03-10'), impacto: 0.5, credito: 0.5 },
			{ date: new Date('2024-03-12'), impacto: 0.6, credito: 0.75 },
			{ date: new Date('2024-03-14'), impacto: 0.75, credito: 1.1 },
			{ date: new Date('2024-03-16'), impacto: 0.9, credito: 1.5 },
			{ date: new Date('2024-03-18'), impacto: 1.05, credito: 1.9 },
			{ date: new Date('2024-03-20'), impacto: 1.2, credito: 2.2 },
			{ date: new Date('2024-03-22'), impacto: 1.4, credito: 2.4 },
			{ date: new Date('2024-03-24'), impacto: 1.55, credito: 2.5 },
			{ date: new Date('2024-03-26'), impacto: 1.5, credito: 2.1 },
			{ date: new Date('2024-03-28'), impacto: 1.6, credito: 1.5 },
			{ date: new Date('2024-03-30'), impacto: 1.65, credito: 0.8 },
			{ date: new Date('2024-04-01'), impacto: 1.7, credito: 0.55 },
			{ date: new Date('2024-04-03'), impacto: 1.85, credito: 0.5 },
			{ date: new Date('2024-04-05'), impacto: 2.1, credito: 0.55 },
			{ date: new Date('2024-04-07'), impacto: 2.3, credito: 0.6 }
		],
		'1Y': [
			{ date: new Date('2023-01-01'), impacto: 0.4, credito: 0.3 },
			{ date: new Date('2023-02-01'), impacto: 0.55, credito: 0.5 },
			{ date: new Date('2023-03-01'), impacto: 0.7, credito: 0.9 },
			{ date: new Date('2023-04-01'), impacto: 0.9, credito: 1.4 },
			{ date: new Date('2023-05-01'), impacto: 1.1, credito: 1.8 },
			{ date: new Date('2023-06-01'), impacto: 1.3, credito: 2.1 },
			{ date: new Date('2023-07-01'), impacto: 1.5, credito: 2.4 },
			{ date: new Date('2023-08-01'), impacto: 1.7, credito: 1.8 },
			{ date: new Date('2023-09-01'), impacto: 1.9, credito: 1.2 },
			{ date: new Date('2023-10-01'), impacto: 2.1, credito: 0.7 },
			{ date: new Date('2023-11-01'), impacto: 2.3, credito: 0.55 },
			{ date: new Date('2023-12-01'), impacto: 2.5, credito: 0.6 }
		],
		All: [
			{ date: new Date('2021-01-01'), impacto: 0.3, credito: 0.2 },
			{ date: new Date('2022-01-01'), impacto: 0.8, credito: 0.9 },
			{ date: new Date('2023-01-01'), impacto: 1.5, credito: 2.0 },
			{ date: new Date('2024-01-01'), impacto: 2.3, credito: 0.6 }
		]
	};

	// Estado reativo
	type Period = '1M' | '1Y' | 'All';
	const periodOptions: Period[] = ['1M', '1Y', 'All'];
	let selectedPeriod = $state<Period>('1M');

	// $derived recalcula automaticamente quando selectedPeriod muda
	let data = $derived(dataByPeriod[selectedPeriod]);

	// Dados das métricas
	interface Metric {
		label: string;
		value: string;
		change: string;
		period: string;
		positive: boolean;
	}

	const metrics: Metric[] = [
		{
			label: 'Impacto Total',
			value: '7.2',
			change: '+2%',
			period: 'no último mês',
			positive: true
		},
		{
			label: 'Crédito Total',
			value: '1.328',
			change: '-7%',
			period: 'no último mês',
			positive: false
		},
		{
			label: 'Projetos Ativos',
			value: '11',
			change: '+5',
			period: 'no último ano',
			positive: true
		}
	];

	const projectSlices = [
		{ label: 'Ativos', value: 72, color: '#2563eb' },
		{ label: 'Finalizados', value: 28, color: '#a855f7' }
	];

	const series = [
		{ key: 'impacto', label: 'Impacto', color: '#2563eb' },
		{ key: 'credito', label: 'Crédito', color: '#a855f7' }
	];
</script>

<!-- Conteúdo principal -->
<div class="main-container">
	<!-- Barra superior com ações -->
	<header class="topbar">
		<!-- Cards de métricas -->
		<div class="metrics-grid">
			{#each metrics as m (m.label)}
				<MetricCard
					label={m.label}
					value={m.value}
					change={m.change}
					period={m.period}
					positive={m.positive}
				/>
			{/each}
		</div>
		<div class="topbar-actions">
			<Button variant="secondary" size="sm" class="action-btn">Adicionar</Button>
			<Button variant="secondary" size="sm" class="action-btn">Ordenar</Button>
		</div>
	</header>

	<!-- Área de conteúdo -->
	<div class="content-area">
		<!-- Linha de gráficos -->
		<div class="charts-grid">
			<!-- Gráfico de linhas integrado -->
			<LineChart
				title="Impacto vs Crédito"
				description="Evolução do impacto e crédito ao longo do tempo"
				{data}
				{series}
				footerTitle="Crescimento constante detectado"
				footerDescription={`Dados atualizados para o período ${selectedPeriod}`}
				{selectedPeriod}
				{periodOptions}
				onPeriodChange={(period) => (selectedPeriod = period as Period)}
				class="line-card"
			/>

			<!-- Gráfico de pizza -->
			<PieChart title="Projetos" slices={projectSlices} class="pie-card" />
		</div>
	</div>
</div>

<style>
	.main-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-width: 0;
	}

	.topbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		padding: 20px 32px 10px;
		flex-wrap: wrap;
	}

	.topbar-actions {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-left: auto;
		flex-shrink: 0;
	}

	:global(.action-btn) {
		background-color: var(--color-secondary) !important;
		color: var(--foreground) !important;
		font-weight: 500 !important;
		border-radius: 6px !important;
		border: none !important;
	}

	.content-area {
		flex: 1;
		padding: 10px 32px 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
		width: 100%;
	}

	/* Cards de métricas */
	.metrics-grid {
		display: flex;
		gap: 20px;
		flex-wrap: wrap;
		flex: 1 1 0;
		min-width: 0;
	}

	/* Linha dos gráficos */
	.charts-grid {
		display: flex;
		gap: 20px;
		align-items: flex-start;
		flex-wrap: wrap;
		width: 100%;
	}

	/* Card do gráfico de linhas */
	:global(.line-card) {
		flex: 2 1 400px;
		min-width: 0;
		border-radius: 12px !important;
		border: 2px solid #3b82f6 !important;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
	}

	/* Card do gráfico de pizza */
	:global(.pie-card) {
		flex: 1 1 100px;
		min-width: 0;
	}

	@media (max-width: 1024px) {
		:global(.pie-card),
		:global(.line-card) {
			flex: 1 1 100%;
		}
	}
</style>
