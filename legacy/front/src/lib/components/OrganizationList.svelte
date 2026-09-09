<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import RecordActions from '$lib/components/RecordActions.svelte';
	import type { ProponentRecord } from '$lib/types.js';

	let { organizations }: { organizations: ProponentRecord[] } = $props();

	let searchQuery = $state('');

	let filteredOrganizations = $derived(
		organizations.filter((organization) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				organization.id.toString().includes(query) ||
				organization.name.toLowerCase().includes(query) ||
				organization.email.toLowerCase().includes(query)
			);
		})
	);
</script>

<div class="list-container">
	<div class="list-header-row">
		<div class="search-wrap">
			<Input
				type="text"
				placeholder="Buscar organizações por ID, nome ou e-mail..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>
		<span class="count-tag">
			{filteredOrganizations.length} de {organizations.length} registro(s)
		</span>
	</div>

	{#if filteredOrganizations.length === 0}
		<p class="empty-state">Nenhuma organização cadastrada ou encontrada para a busca.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Nome</th>
						<th>E-mail</th>
						<th>Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredOrganizations as organization (organization.id)}
						<tr>
							<td>{organization.id}</td>
							<td colspan="2">
								<form
									method="POST"
									action="/organizations?/update"
									class="row-form"
									id={`organization-${organization.id}`}
								>
									<input type="hidden" name="id" value={organization.id} />
									<Input name="name" value={organization.name} required maxlength={150} />
									<Input
										name="email"
										type="email"
										value={organization.email}
										required
										maxlength={150}
									/>
								</form>
							</td>
							<td class="actions-cell">
								<RecordActions
									updateFormId={`organization-${organization.id}`}
									deleteId={organization.id}
									deleteAction="/organizations?/delete"
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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

	.row-form {
		display: grid;
		grid-template-columns: minmax(180px, 1fr) minmax(220px, 1fr);
		gap: 12px;
		align-items: center;
	}

	.table-wrap {
		overflow-x: auto;
		width: 100%;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 10px 8px;
		border-bottom: 1px solid var(--border);
		text-align: left;
		vertical-align: bottom;
	}

	th {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		font-weight: 600;
	}

	.actions-cell {
		width: 158px;
		min-width: 158px;
		white-space: nowrap;
		vertical-align: middle;
	}

	@media (max-width: 760px) {
		.row-form {
			grid-template-columns: 1fr;
		}
	}
</style>
