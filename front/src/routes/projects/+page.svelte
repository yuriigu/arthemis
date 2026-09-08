<script lang="ts">
	import ProjectForm from '$lib/components/ui/form/ProjectForm.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
</script>

<div class="page-container">
	<header class="page-header">
		<h1 class="page-title">Projetos</h1>
		<p class="page-description">Cadastre os projetos vinculados às organizações.</p>
	</header>

	<ProjectForm data={data.form} proponents={data.proponents} sdgs={data.sdgs}/>
</div>

<style>
	.page-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 32px;
		gap: 24px;
		width: 100%;
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
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
</style>
