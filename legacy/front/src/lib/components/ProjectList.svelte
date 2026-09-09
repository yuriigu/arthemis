<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Project } from '$lib/types.js';
	import { enhance } from '$app/forms';

	let { projects }: { projects: Project[] } = $props();

	let searchQuery = $state('');

	let filteredProjects = $derived(
		projects.filter((project) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				project.id.toString().includes(query) ||
				project.name.toLowerCase().includes(query) ||
				project.locations?.some(l => l.ecosystem.toLowerCase().includes(query))
			);
		})
	);
</script>

<div class="list-container">
	<div class="list-header-row">
		<div class="search-wrap">
			<Input
				type="text"
				placeholder="Buscar projetos por ID, nome ou ecossistema..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>
		<span class="count-tag">
			{filteredProjects.length} de {projects.length} registro(s)
		</span>
	</div>

	{#if filteredProjects.length === 0}
		<p class="empty-state">Nenhum projeto encontrado para a busca.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Nome</th>
						<th>Ecossistema</th>
						<th>Período</th>
						<th>Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredProjects as project (project.id)}
						<tr>
							<td>
								<a href={`/projects/${project.id}`} class="project-link">
									{project.name}
								</a>
							</td>
							<td>
								<span>
									{project.locations?.map(l => l.ecosystem).filter(Boolean).join(', ') || 'Não definido'}
								</span>
							</td>
							<td>
								<span>
									{new Date(project.lifetime_start).toLocaleDateString('pt-BR')} - 
									{new Date(project.lifetime_end).toLocaleDateString('pt-BR')}
								</span>
							</td>
							<td class="actions-cell">
								<form method="POST" action="?/delete" class="delete-form" use:enhance={() => {
                                    return async ({ update }) => {
                                        await update();
                                        
                                        history.replaceState(history.state, '', location.pathname);
                                    };
                                }}>
									<input type="hidden" name="id" value={project.id} />
									<Button type="submit" variant="destructive" size="sm">Remover</Button>
								</form>
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

	.table-wrap {
		width: 100%;
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--card);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	th, td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border);
	}

	th {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted-foreground);
		background: color-mix(in srgb, var(--muted) 40%, transparent);
	}

	tr:last-child td {
		border-bottom: none;
	}

	td {
		font-size: 0.875rem;
		vertical-align: middle;
	}

	.project-link {
		color: var(--primary);
		font-weight: 600;
		text-decoration: none;
		transition: text-decoration 0.2s;
	}

	.project-link:hover {
		text-decoration: underline;
	}

	.actions-cell {
		width: 1%;
		white-space: nowrap;
	}

	.delete-form {
		display: inline-flex;
		margin: 0;
	}
</style>
