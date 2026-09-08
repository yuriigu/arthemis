<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import RecordActions from '$lib/components/RecordActions.svelte';
	import type { ObservationRecord } from '$lib/types.js';
	import { toast } from 'svelte-sonner';

	let { observations: initial }: { observations: ObservationRecord[] } = $props();
	let observations = $state(initial);
	
	let searchQuery = $state('');

	let filteredObservations = $derived(
		observations.filter((observation) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				observation.id.toString().includes(query) ||
				observation.indicatorId.toString().includes(query) ||
				observation.value.toString().includes(query) ||
				observation.date.includes(query) ||
				observation.positionText.toLowerCase().includes(query)
			);
		})
	);

async function handleFileUpload(event: Event, observationId: number | string) {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	
	if (!file) return;

	try {
		const content = await file.text();
		
		const geoJson = JSON.parse(content);
		const jsonString = JSON.stringify(geoJson);

		const index = observations.findIndex(o => o.id === observationId);
		if (index !== -1) {
			observations[index].positionText = jsonString; 
		}

		toast.success('Arquivo GeoJSON carregado com sucesso!');
		
		input.value = ''; 
	} catch (error) {
		input.value = '';
		toast.error('Erro ao ler o arquivo. Certifique-se de que é um JSON válido.');
	}
}
</script>

<div class="list-container">
	<div class="list-header-row">
		<div class="search-wrap">
			<Input
				type="text"
				placeholder="Buscar observações por ID, indicador, valor, data ou geojson..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>
		<span class="count-tag">
			{filteredObservations.length} de {observations.length} registro(s)
		</span>
	</div>

	{#if filteredObservations.length === 0}
		<p class="empty-state">Nenhuma observação cadastrada ou encontrada para a busca.</p>
	{:else}
		<div class="observation-list">
			{#each filteredObservations as observation (observation.id)}
				<article class="observation-row">
					<header>
						<div>
							<strong>Observação #{observation.id}</strong>
							<span>Indicador #{observation.indicatorId}</span>
						</div>
						<RecordActions
							updateFormId={`observation-${observation.id}`}
							deleteId={observation.id}
							deleteAction="/observations?/delete"
						/>
					</header>

					<form
						method="POST"
						action="/observations?/update"
						class="row-form"
						id={`observation-${observation.id}`}
					>
						<input type="hidden" name="id" value={observation.id} />
						<label>
							<span>Indicador</span>
							<Input
								name="indicator_id"
								type="number"
								min="1"
								value={observation.indicatorId}
								required
							/>
						</label>
						<label>
							<span>Valor</span>
							<Input name="value" type="number" step="any" value={observation.value} required />
						</label>
						<label>
							<span>Data</span>
							<Input name="date" type="date" value={observation.date} required />
						</label>
						<label class="position-field">
							<span>Posição</span>
							<Input onchange={(event) => handleFileUpload(event, observation.id)} type="file" accept=".json" placeholder="Ex:" class="p-0 rounded-md cursor-pointer text-xs text-muted-foreground bg-background file:h-full file:bg-secondary file:text-secondary-foreground file:border-0 file:px-4 file:mr-4 file:hover:bg-secondary/80 file:transition-colors file:items-center" />
						</label>
					</form>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.list-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.list-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.search-wrap {
		flex: 1;
		min-width: 280px;
	}

	:global(.search-input) {
		width: 100%;
	}

	.count-tag {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	.empty-state {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
		padding: 24px 0;
		text-align: center;
	}

	.observation-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.observation-row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 14px;
		background: var(--card);
	}

	.observation-row header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: flex-start;
	}

	.observation-row strong,
	.observation-row span {
		display: block;
	}

	.observation-row strong {
		color: var(--foreground);
	}

	.observation-row span {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	.row-form {
		display: grid;
		gap: 12px;
		align-items: end;
		grid-template-columns: minmax(120px, 160px) minmax(120px, 160px) minmax(140px, 180px) 1fr;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}

	.position-field {
		min-width: 260px;
	}

	:global(.geojson-input) {
		min-height: 96px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.8125rem;
	}

	@media (max-width: 920px) {
		.row-form {
			grid-template-columns: 1fr;
		}

		.observation-row header {
			flex-direction: column;
		}
	}
</style>
