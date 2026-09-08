<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import { Input } from '$lib/components/ui/input/index.js';
	import OrganizationList from '$lib/components/OrganizationList.svelte';
	import UserList from '$lib/components/UserList.svelte';
	import ObservationList from '$lib/components/ObservationList.svelte';
	import ProjectList from '$lib/components/ProjectList.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let activeTab = $state<'all' | 'organizations' | 'users' | 'observations' | 'projects'>('all');

	// Filtro local para organizações
	let filteredOrgs = $derived(
		data.organizations.filter((org) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				org.id.toString().includes(query) ||
				org.name.toLowerCase().includes(query) ||
				org.email.toLowerCase().includes(query)
			);
		})
	);

	// Filtro local para usuários
	let filteredUsers = $derived(
		data.users.filter((user) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				user.id.toLowerCase().includes(query) ||
				user.username.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query) ||
				user.role.toLowerCase().includes(query) ||
				user.proponentName.toLowerCase().includes(query)
			);
		})
	);

	// Filtro local para observações
	let filteredObservations = $derived(
		data.observations.filter((obs) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				obs.id.toString().includes(query) ||
				obs.indicatorId.toString().includes(query) ||
				obs.value.toString().includes(query) ||
				obs.date.includes(query) ||
				obs.positionText.toLowerCase().includes(query)
			);
		})
	);

	let filteredProjects = $derived(
		data.projects.filter((project) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				project.id.toString().includes(query) ||
				project.name.toLowerCase().includes(query) ||
				project.locations?.some(l => l.ecosystem.toLowerCase().includes(query))
			);
		})
	);

	let totalResults = $derived(
		filteredOrgs.length + filteredUsers.length + filteredObservations.length + filteredProjects.length
	);
</script>

<div class="page-container">
	<header class="page-header">
		<h1 class="page-title">Busca Global</h1>
		<p class="page-description">
			Pesquise por organizações, usuários ou observações cadastradas em todo o sistema.
		</p>
	</header>

	<div class="search-section">
		<div class="search-bar-wrap">
			<span class="search-icon-inside">
				<SearchIcon size={20} />
			</span>
			<Input
				type="text"
				placeholder="Digite para buscar em tudo (Nome, ID, E-mail, Valores, Datas...)"
				bind:value={searchQuery}
				class="global-search-input"
			/>
		</div>

		<div class="tabs-container">
			<button
				class="tab-button"
				class:active={activeTab === 'all'}
				onclick={() => (activeTab = 'all')}
			>
				Tudo ({totalResults})
			</button>
			<button
				class="tab-button {activeTab === 'projects' ? 'active' : ''}"
				onclick={() => (activeTab = 'projects')}
			>
				Projetos ({filteredProjects.length})
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'organizations'}
				onclick={() => (activeTab = 'organizations')}
			>
				Organizações ({filteredOrgs.length})
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'users'}
				onclick={() => (activeTab = 'users')}
			>
				Usuários ({filteredUsers.length})
			</button>
			<button
				class="tab-button"
				class:active={activeTab === 'observations'}
				onclick={() => (activeTab = 'observations')}
			>
				Observações ({filteredObservations.length})
			</button>
		</div>
	</div>

	<div class="results-container">
		{#if totalResults === 0}
			<div class="empty-state-card">
				<p class="empty-state-title">Nenhum resultado encontrado</p>
				<p class="empty-state-desc">
					Tente digitar outras palavras-chave ou IDs na barra de busca.
				</p>
			</div>
		{:else}
			{#if activeTab === 'all' || activeTab === 'projects'}
				<div class="panel">
					<div class="panel-header">
						<h2>Projetos</h2>
						<span class="count-badge">{filteredProjects.length}</span>
					</div>
					
					<ProjectList projects={filteredProjects} />
				</div>
			{/if}

			<!-- Seção de Organizações -->
			{#if (activeTab === 'all' || activeTab === 'organizations') && filteredOrgs.length > 0}
				<section class="panel result-panel">
					<div class="panel-header">
						<h2>Organizações</h2>
						<span class="count-badge">{filteredOrgs.length} encontrada(s)</span>
					</div>
					<div class="panel-body">
						<OrganizationList organizations={filteredOrgs} />
					</div>
				</section>
			{/if}

			<!-- Seção de Usuários -->
			{#if (activeTab === 'all' || activeTab === 'users') && filteredUsers.length > 0}
				<section class="panel result-panel">
					<div class="panel-header">
						<h2>Usuários</h2>
						<span class="count-badge">{filteredUsers.length} encontrado(s)</span>
					</div>
					<div class="panel-body">
						<UserList users={filteredUsers} proponents={data.organizations} />
					</div>
				</section>
			{/if}

			<!-- Seção de Observações -->
			{#if (activeTab === 'all' || activeTab === 'observations') && filteredObservations.length > 0}
				<section class="panel result-panel">
					<div class="panel-header">
						<h2>Observações</h2>
						<span class="count-badge">{filteredObservations.length} encontrada(s)</span>
					</div>
					<div class="panel-body">
						<ObservationList observations={filteredObservations} />
					</div>
				</section>
			{/if}

		{/if}
	</div>
</div>

<style>
	.page-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 32px;
		gap: 24px;
		width: 100%;
		max-width: 1180px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.page-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--foreground);
		margin: 0;
	}

	.page-description {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	.search-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 20px;
	}

	.search-bar-wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.search-icon-inside {
		position: absolute;
		left: 16px;
		color: var(--muted-foreground);
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	:global(.global-search-input) {
		padding-left: 48px !important;
		height: 48px !important;
		font-size: 1rem !important;
		border-radius: 24px !important;
		background: color-mix(in srgb, var(--foreground) 4%, transparent) !important;
	}

	.tabs-container {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		border-bottom: 1px solid var(--border);
		padding-bottom: 4px;
	}

	.tab-button {
		background: none;
		border: none;
		padding: 8px 16px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted-foreground);
		cursor: pointer;
		border-radius: 20px;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		background: color-mix(in srgb, var(--foreground) 4%, transparent);
		color: var(--foreground);
	}

	.tab-button.active {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.results-container {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 20px;
		background: var(--card);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
		padding-bottom: 12px;
	}

	.panel-header h2 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
		color: var(--foreground);
	}

	.count-badge {
		font-size: 0.75rem;
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		color: var(--primary);
		padding: 4px 8px;
		border-radius: 12px;
		font-weight: 500;
	}

	.empty-state-card {
		border: 1px dashed var(--border);
		border-radius: 8px;
		padding: 48px;
		text-align: center;
		background: var(--card);
	}

	.empty-state-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--foreground);
		margin: 0 0 8px 0;
	}

	.empty-state-desc {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	@media (max-width: 600px) {
		.page-container {
			padding: 16px;
		}

		.search-section {
			padding: 14px;
		}

		.tab-button {
			padding: 6px 12px;
			font-size: 0.8rem;
		}
	}
</style>
