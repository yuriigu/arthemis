<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { userSchema } from './UserFormSchema.js';
	import { cn } from '$lib/utils.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { UserFormProps } from './types.js';
	import { toast } from 'svelte-sonner';

	let {
		data,
		proponents,
		title = 'Novo Usuário',
		description = 'Preencha os dados do usuário.',
		submitLabel = 'Cadastrar Usuário',
		action = '?/create',
		class: className
	}: UserFormProps & { action?: string } = $props();

	const form = superForm(data, {
		validators: zod4Client(userSchema),
		onResult({ result }) {
			if (result.type === 'success') {
				toast.success('Usuário cadastrado com sucesso!');
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

	const proponentTriggerContent = $derived(
		proponents.find((p) => String(p.id) === String($formData.proponent_id))?.name ?? 'Selecione uma organização'
	);

	const roleOptions = [
		{ value: 'admin', label: 'Administrador' },
		{ value: 'manager', label: 'Gerente' },
		{ value: 'visitor', label: 'Visitante' }
	] as const;

	const roleTriggerContent = $derived(
		roleOptions.find((role) => role.value === $formData.role)?.label ?? 'Selecione um perfil'
	);
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
			<Form.Field {form} name="proponent_id">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Organização</Form.Label>
						<Select.Root type="single" {...props} bind:value={$formData.proponent_id}>
							<Select.Trigger class="w-70">{proponentTriggerContent}</Select.Trigger>
							<Select.Content class="max-h-75">
								{#each proponents as proponent (proponent.id)}
									<Select.Item value={String(proponent.id)}>{proponent.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.Description>Organização proponente vinculada ao usuário.</Form.Description>
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
							placeholder="usuario@organizacao.com"
							maxlength={150}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>E-mail usado para acesso ao sistema.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

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
				<Form.Description>Nome usado para autenticação.</Form.Description>
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
							placeholder="Senha do usuário"
							maxlength={255}
							autocomplete="new-password"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="role">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Perfil</Form.Label>
						<Select.Root type="single" {...props} bind:value={$formData.role}>
							<Select.Trigger class="w-70">{roleTriggerContent}</Select.Trigger>
							<Select.Content>
								{#each roleOptions as role (role.value)}
									<Select.Item value={role.value}>{role.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.Description>Permissão do usuário no sistema.</Form.Description>
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
