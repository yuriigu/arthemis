<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { observationSchema } from './ObservationFormSchema.js';
	import { cn } from '$lib/utils.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { ObservationProps } from './types.js';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';

	let {
		data,
		indicators,
		title = 'Observação',
		description = 'Insira os dados da observação.',
		submitLabel = 'Cadastrar Observação',
		action = '?/create',
		class: className
	}: ObservationProps & { action?: string } = $props();

	const form = superForm(data, {
		validators: zod4Client(observationSchema),
		dataType: 'json',
		onResult({ result }) {
			if (result.type === 'success' ) {
				toast.success('Projeto cadastrado com sucesso!');
			}
			else if (result.type === 'failure') {
				toast.error('Verifique as informações inseridas e tente novamente');
			}
			else if (result.type === 'error') {
				toast.error('Erro interno');
			}
		}
	});

	const { form: formData, enhance, submitting, errors } = form;

	const observationTriggerContent = $derived(
		indicators.find((i) => String(i.id) === String($formData.indicator_id))?.name ?? 'Selecione um indicador'
	);

	function toCalendarDate(date: Date | string | undefined) {
		if (!date) return today(getLocalTimeZone());

		const parsedDate = date instanceof Date ? date : new Date(date);
		if (Number.isNaN(parsedDate.getTime())) return today(getLocalTimeZone());

		return new CalendarDate(
			parsedDate.getFullYear(),
			parsedDate.getMonth() + 1,
			parsedDate.getDate()
		);
	}

	let selectedDate = $state<DateValue | undefined>(toCalendarDate($formData.date));
	let positionText = $state(
		typeof $formData.position === 'string'
			? $formData.position
			: JSON.stringify(
					$formData.position ?? {
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [125.6, 10.1]
						},
						properties: {
							name: 'Dinagat Islands'
						}
					},
					null,
					2
				)
	);

	$effect(() => {
		const date = selectedDate;
		untrack(() => {
			if (date) $formData.date = date.toDate(getLocalTimeZone());
		});
	});

	$effect(() => {
		const position = positionText;
		untrack(() => {
			$formData.position = position as never;
		});
	});

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;

		try {
			const content = await file.text();

			$formData.position = JSON.parse(content);

			toast.success('Arquivo carregado com sucesso!');
		} catch (error) {
			input.value = '';
			toast.error('Insira um arquivo JSON');
		}
	}
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
			<Form.Field {form} name="indicator_id">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Indicador</Form.Label>
						<Select.Root type="single" {...props} bind:value={$formData.indicator_id}>
							<Select.Trigger class="w-70">{observationTriggerContent}</Select.Trigger>
							<Select.Content class="max-h-75">
								{#each indicators as indicator (indicator.id)}
									<Select.Item value={String(indicator.id)}>{indicator.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="value">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Valor</Form.Label>
						<Input
							{...props}
							type="number"
							bind:value={$formData.value}
							placeholder="Valor da observação"
							maxlength={255}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="date">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Data</Form.Label>
						<div class="date-picker-section">
							<Calendar
								type="single"
								bind:value={selectedDate}
								class="observation-calendar rounded-md border shadow-sm"
								captionLayout="dropdown"
								locale="pt-BR"
								maxValue={today(getLocalTimeZone())}
							/>
							{#if selectedDate}
								<p class="date-summary">
									{selectedDate.toDate(getLocalTimeZone()).toLocaleDateString('pt-BR')}
								</p>
							{/if}
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="position">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Posição</Form.Label>
						<Input onchange={(event) => handleFileUpload(event)} type="file" accept=".json" placeholder="Ex:" class="p-0 rounded-md cursor-pointer text-xs text-muted-foreground bg-background file:h-full file:bg-secondary file:text-secondary-foreground file:border-0 file:px-4 file:mr-4 file:hover:bg-secondary/80 file:transition-colors file:items-center" />
					{/snippet}
				</Form.Control>
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

	.date-picker-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 100%;
		overflow-x: auto;
	}

	:global(.observation-calendar) {
		align-self: flex-start;
		max-width: 100%;
	}

	:global(.form-footer) {
		padding-left: 0 !important;
		padding-right: 0 !important;
		padding-bottom: 0 !important;
	}

	.date-summary {
		color: var(--muted-foreground);
		font-size: 0.875rem;
		margin: 8px 0 0;
	}
</style>
