<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';	
	import { proponentSchema } from './ProponentFormschema.js';
	import { cn } from '$lib/utils.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ProponentFormProps } from './types.js';


	let {
		data,
		title = 'Nova Organização',
		description = 'Preencha os dados da organização.',
		submitLabel = 'Cadastrar Organização',
		action = '?/create',
		class: className
	}: ProponentFormProps & { action?: string } = $props();

	const form = superForm(data, {
		validators: zod4Client(proponentSchema),
		onResult({ result }) {
			if (result.type === 'success') {
				toast.success('Organização cadastrada com sucesso!');
			}
			else if (result.type === 'failure') {
				toast.error('Verifique as informações inseridas e tente novamente');
			}
			else if (result.type === 'error') {
				toast.error('Erro interno');
			}
		}
	});

	const { form: formData, enhance, submitting } = form;
</script>

<Card.Root class={cn('form-card', className)}>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
	</Card.Header>

	<Card.Content>
		<form method="POST" {action} use:enhance class="form-body">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Nome</Form.Label>
						<Input
							{...props}
							bind:value={$formData.name}
							placeholder="Nome da organização"
							maxlength={150}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>Nome completo da organização.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>E-mail</Form.Label>
						<Input
							{...props}
							type="email"
							bind:value={$formData.email}
							placeholder="contato@organizacao.com"
							maxlength={150}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>E-mail de contato da organização.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Card.Footer class="form-footer">
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Salvando...' : submitLabel}
				</Button>
			</Card.Footer>
		</form>
	</Card.Content>
</Card.Root>

<style>
	:global(.form-card) {
		border-radius: 12px !important;
	}

	.form-body {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	:global(.form-footer) {
		padding-left: 0 !important;
		padding-right: 0 !important;
		padding-bottom: 0 !important;
	}
</style>