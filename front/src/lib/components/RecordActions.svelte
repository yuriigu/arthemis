<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	type Props = {
		updateFormId: string;
		deleteId: string | number;
		deleteAction?: string;
		saveLabel?: string;
		deleteLabel?: string;
	};

	let {
		updateFormId,
		deleteId,
		deleteAction = '?/delete',
		saveLabel = 'Salvar',
		deleteLabel = 'Excluir'
	}: Props = $props();
</script>

<div class="record-actions">
	<Button type="submit" form={updateFormId} size="sm" class="action-button">{saveLabel}</Button>
	<form method="POST" action={deleteAction}>
		<input type="hidden" name="id" value={deleteId} />
		<Button type="submit" variant="destructive" size="sm" class="action-button"
			>{deleteLabel}</Button
		>
	</form>
</div>

<style>
	.record-actions {
		display: inline-flex;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
		width: max-content;
		min-width: 142px;
		white-space: nowrap;
	}

	.record-actions form {
		display: inline-flex;
		margin: 0;
	}

	:global(.action-button) {
		min-width: 64px;
	}
</style>
