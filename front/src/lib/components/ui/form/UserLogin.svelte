<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { userLoginSchema } from './UserLoginSchema.js';
	import { cn } from '$lib/utils.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { UserLoginProps } from './types.js';
	import { toast } from 'svelte-sonner';

	let {
		data,
		title = 'Entrar',
		description = 'Acesse com seu usuário e senha.',
		submitLabel = 'Entrar',
		class: className
	}: UserLoginProps = $props();

	const form = superForm(data, {
		validators: zod4Client(userLoginSchema),
		onResult({ result }) {
			if (result.type == 'failure') {
				toast.error('Usuário/Senha incorretos');
			}
			else if (result.type === 'error') {
				toast.error('Erro interno');
			}
		}
	});

	const { form: formData, errors, message, enhance, submitting } = form;
</script>

<Card.Root class={cn('form-card', className)}>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		{#if description}
			<Card.Description>{description}</Card.Description>
		{/if}
	</Card.Header>

	<Card.Content>
		<form method="POST" use:enhance class="form-body">
			<Form.Field {form} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Usuário</Form.Label>
						<Input
							{...props}
							bind:value={$formData.username}
							placeholder="Nome do Usuário"
							maxlength={150}
							autocomplete="username"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Senha</Form.Label>
						<Input
							{...props}
							type="password"
							bind:value={$formData.password}
							placeholder="Sua senha"
							maxlength={255}
							autocomplete="current-password"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>


			{#if $message}
				<div class="login-error">
					⚠️ {typeof $message === 'object' ? $message.text : $message}
				</div>
			{/if}

			<Card.Footer class="form-footer">
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Entrando...' : submitLabel}
				</Button>
			</Card.Footer>
		</form>
	</Card.Content>
</Card.Root>

<style>
	:global(.form-card) {
		border-radius: 12px !important;
		border: 1px solid var(--border) !important;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
	}

	:global(.form-card .card-header) {
		padding-bottom: 20px !important;
		border-bottom: 1px solid var(--border) !important;
	}

	:global(.form-card .card-title) {
		font-size: 20px !important;
		font-weight: 600 !important;
		color: var(--foreground) !important;
	}

	:global(.form-card .card-description) {
		font-size: 14px !important;
		color: var(--muted-foreground) !important;
		margin-top: 4px !important;
	}

	:global(.form-card .card-content) {
		padding: 20px 0 !important;
	}

	.form-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	:global(.form-card .form-field) {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	:global(.form-card .form-label) {
		font-size: 13px !important;
		font-weight: 600 !important;
		color: var(--foreground) !important;
	}

	:global(.form-card input) {
		height: 40px !important;
		padding: 10px 12px !important;
		border-radius: 8px !important;
		transition: all 0.2s ease !important;
	}

	:global(.form-card input:focus) {
		border-color: var(--primary) !important;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent) !important;
	}

	.login-error {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: 8px;
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		color: #b91c1c;
		font-size: 13px;
		font-weight: 500;
	}

	:global(.form-footer) {
		padding-left: 0 !important;
		padding-right: 0 !important;
		padding-bottom: 0 !important;
		padding-top: 20px !important;
		border-top: 1px solid var(--border) !important;
	}

	:global(.form-footer button) {
		width: 100% !important;
		height: 40px !important;
		font-weight: 600 !important;
		border-radius: 8px !important;
		transition: all 0.2s ease !important;
	}

	:global(.form-footer button:hover:not(:disabled)) {
		transform: translateY(-2px) !important;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
	}
</style>
