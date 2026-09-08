<script lang="ts">
	import ProponentForm from '$lib/components/ui/form/ProponentForm.svelte';
	import OrganizationList from '$lib/components/OrganizationList.svelte';
	import type { ActionData, PageData } from './$types.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="page-container">
	<header class="page-header">
		<h1 class="page-title">Organizações</h1>
		<p class="page-description">Cadastre, edite e remova as organizações do sistema.</p>
	</header>

	{#if form?.message}
		<p class:success-message={form.success} class:error-message={!form.success}>{form.message}</p>
	{/if}

	<ProponentForm data={data.form} action="?/create" />

	<section class="panel list-panel">
		<div class="section-heading">
			<h2>Organizações cadastradas</h2>
		</div>

		<OrganizationList organizations={data.organizations} />
	</section>
</div>

<style>
	.page-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 32px;
		gap: 24px;
		width: 100%;
		max-width: 1120px;
		margin: 0 auto;
	}

	.page-header,
	.section-heading {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: flex-start;
	}

	.page-header {
		flex-direction: column;
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

	.panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 20px;
		background: var(--card);
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.success-message,
	.error-message {
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 0.875rem;
	}

	.success-message {
		background: color-mix(in srgb, var(--primary) 12%, transparent);
		color: var(--primary);
	}

	.error-message {
		background: color-mix(in srgb, var(--destructive) 12%, transparent);
		color: var(--destructive);
	}

	@media (max-width: 760px) {
		.page-container {
			padding: 20px;
		}
	}
</style>
