<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { projectSchema } from './ProjectFormSchema.js';
	import { cn } from '$lib/utils.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { ProjectFormProps } from './types.js';
	import { getLocalTimeZone } from '@internationalized/date';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import type { DateRange } from 'bits-ui';
	import { untrack } from 'svelte';
	import FormFieldWrapper from './FormFieldWrapper.svelte';
	import { toast } from 'svelte-sonner';
	import X from '@lucide/svelte/icons/x';

	let {
		data,
		proponents,
		sdgs,
		title = 'Novo Projeto',
		description = 'Preencha os dados do projeto.',
		submitLabel = 'Cadastrar Projeto',
		class: className
	}: ProjectFormProps = $props();

	const form = superForm(data, {
		validators: zod4Client(projectSchema),
		dataType: 'json',
		validationMethod: 'onblur',
		onUpdated({ form }) {
        	if (form.valid) {
				dateRange = { start: undefined, end: undefined };
        	}
    	},
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

	const proponentTriggerContent = $derived(
		proponents.find((p) => String(p.id) === String($formData.proponent_id))?.name ?? 'Selecione uma Organização'
	);

	/*
	 Estado local do calendário.
	 O RangeCalendar usa objetos CalendarDate do @internationalized/date,
	 não strings — por isso não podemos fazer bind direto no $formData.
	*/
	let dateRange = $state<DateRange>({ start: undefined, end: undefined });

	/*
	 Toda vez que o usuário seleciona/altera as datas no calendário,
	 convertemos o CalendarDate para Date nativo com .toDate(getLocalTimeZone())
	 e gravamos nos campos do superForm — que são os que serão submetidos.
	
	 Se a data ainda não foi selecionada (undefined), gravamos string vazia
	 para que o Zod consiga validar e exibir o erro corretamente.
	*/
	$effect(() => {
		const start = dateRange.start;
		const end = dateRange.end;
		untrack(() => {
			if (start) $formData.lifetime_start = start.toDate(getLocalTimeZone());
			if (end) $formData.lifetime_end = end.toDate(getLocalTimeZone());
		});
	});

	if (!$formData.project_proponents) $formData.project_proponents = [];
	if (!$formData.project_sdgs) $formData.project_sdgs = [];
	if (!$formData.locations) $formData.locations = [];
   	if (!$formData.activities) $formData.activities = [];
    if (!$formData.indicators) $formData.indicators = [];

	let proponentCounter = 0;
	let locationCounter = 0;
	let activityCounter = 0;
	let indicatorCounter = 0;

	function addProponent() {
		proponentCounter++;
		$formData.project_proponents = [...$formData.project_proponents, { 
			id: `p-${proponentCounter}`, proponent_id: '', role: '' 
		}];
	}

	function removeProponent(index: number) {
		$formData.project_proponents = $formData.project_proponents.filter((_, i) => i !== index);
	}

	function addLocation() {
		locationCounter++;
		$formData.locations = [...$formData.locations, { 
			id: `l-${locationCounter}`, ecosystem: '', extent_ha: 0, country: '', position: {}
		}];
	}

	function removeLocation(index: number) {
		$formData.locations = $formData.locations.filter((_, i) => i !== index);
	}

	function addActivity() {
		activityCounter++;
		$formData.activities = [...$formData.activities, {
			id: `a-${activityCounter}`, name: '', description: '', justification: '', location_ids: []
       	}];
    }

	function removeActivity(index: number) {
		$formData.activities = $formData.activities.filter((_, i) => i !== index);
	}

	function addIndicator() {
		indicatorCounter++;
		$formData.indicators = [...$formData.indicators, {
			id: `i-${indicatorCounter}`, location_id: '', activity_id: '', name: '', unit: '',
			value_baseline: 0, value_reference: 0, observation_method: '', justification: ''
		}];
	}

	function removeIndicator(index: number) {
		$formData.indicators = $formData.indicators.filter((_, i) => i !== index);
	}

	async function handleFileUpload(event: Event, index: number) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0]; 
		if (!file) return; 

		try {
			const content = await file.text(); 
	
			$formData.locations[index].position = JSON.parse(content);

			if ($errors.locations?.[index]?.position) {
				$errors.locations[index].position = undefined;
			}
			
			toast.success('Arquivo carregado com sucesso!');
		} catch (error: unknown) {
			target.value = '';
			$formData.locations[index].position = undefined;
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
		<form method="POST" use:enhance class="form-body">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Nome do Projeto</Form.Label>
						<Input {...props} bind:value={$formData.name} placeholder="Nome do projeto" maxlength={150} class="rounded-md max-w-xl w-full"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="proponent_id">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Organização responsável pelo projeto.</Form.Label>
						<Select.Root type="single" {...props} bind:value={$formData.proponent_id}>
							<Select.Trigger class="max-w-xl w-full">{proponentTriggerContent}</Select.Trigger>
							<Select.Content class="rounded-md max-h-75">
								{#each proponents as p (p.id)}
									<Select.Item class="rounded-md" value={String(p.id)}>{p.name}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<FormFieldWrapper
				title="Outras Organizações"
				items={$formData.project_proponents}
				itemTitlePrefix="Organização"
				addLabel="+ Adicionar Organização"
				onAdd={addProponent}
				onRemove={removeProponent}
			>
				{#snippet children(id)}
					<Form.Field {form} name={`project_proponents[${id}].proponent_id`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Organização</Form.Label>
								<Select.Root type="single" {...props} bind:value={$formData.project_proponents[id].proponent_id}>
									<Select.Trigger class="w-full">
										{proponents.find(p => String(p.id) === String($formData.project_proponents[id].proponent_id))?.name || 'Selecione uma Organização'}
									</Select.Trigger>
									<Select.Content class="rounded-md max-h60">
										{#each proponents as p (p.id)}
											<Select.Item class="rounded-md" value={String(p.id)}>{p.name}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`project_proponents[${id}].role`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Função/Papel no Projeto</Form.Label>
								<Input {...props} bind:value={$formData.project_proponents[id].role} class="rounded-md" placeholder="Ex: Financiador, Consultor" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/snippet}
			</FormFieldWrapper>

			<Form.Field {form} name="project_proponents">
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="project_sdgs">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label> Objetivos de Desenvolvimento Sustentável (ODS) </Form.Label>
						<Form.Description class="mb-4">
							Clique sobre um ODS para vinculá-lo ao projeto.
						</Form.Description>
						
						<div class="flex flex-wrap gap-3 mt-2">
							{#each sdgs as s (s.id)}
								{@const isSelected = $formData.project_sdgs.includes(String(s.id))}
								
								<Button
									type="button"
									variant="outline"
									class={cn(
										"flex flex-col items-center justify-start rounded-none transition-all text-center gap-1 w-24 h-auto p-0 border-transparent relative select-none",
										isSelected 
											? "bg-primary text-primary-foreground shadow-sm font-semibold scale-[1.05] hover:bg-primary" 
											: "opacity-50 hover:opacity-100"
									)}
									onclick={() => {
										if (isSelected) {
											$formData.project_sdgs = $formData.project_sdgs.filter(id => id !== String(s.id));
										} else {
											$formData.project_sdgs = [...$formData.project_sdgs, String(s.id)];
										}
									}}
								>
									<img src={s.iconUrl} alt={`ODS ${s.number} - ${s.name}`} class="w-full h-auto object-cover" />

									{#if isSelected}
										<div class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sx">
											<X class="w-3 h-3" strokeWidth={2} />
										</div>
									{/if}
								</Button>
							{/each}
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<!--
				Um único bloco para as duas datas.
				O RangeCalendar gerencia start e end junto

				Usamos Form.Field de lifetime_start para hospedar o calendário
				e exibimos os erros de ambos os campos logo abaixo.
			-->
			<div class="dates-section">
				<Label>Vigência do Projeto</Label>

				<RangeCalendar bind:value={dateRange} class="calendar" />

				<!--
					Exibimos as datas selecionadas como texto para o usuário
					ter confirmação visual do que foi escolhido.
				-->
				{#if dateRange.start && dateRange.end}
					<p class="date-summary">
						{dateRange.start.toDate(getLocalTimeZone()).toLocaleDateString('pt-BR')} → {dateRange.end
							.toDate(getLocalTimeZone())
							.toLocaleDateString('pt-BR')}
					</p>
				{/if}

				<!-- Erros de validação de cada campo de data -->
				<Form.Field {form} name="lifetime_start">
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="lifetime_end">
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Form.Field {form} name="justification">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Justificativa</Form.Label>
						<Textarea
							{...props}
							bind:value={$formData.justification}
							placeholder="Descreva a justificativa do projeto..."
							class = "rounded-md w-full min-h-30 resize-none"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<FormFieldWrapper
				title="Localizações do Projeto"
				items={$formData.locations}
				itemTitlePrefix="Local"
				addLabel="+ Novo Local"
				onAdd={addLocation}
				onRemove={removeLocation}
			>
				{#snippet children(id)}
					<Form.Field {form} name={`locations[${id}].ecosystem`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Ecossistema</Form.Label>
								<Input {...props} bind:value={$formData.locations[id].ecosystem} placeholder="Ex: Amazônia" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`locations[${id}].country`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">País</Form.Label>
								<Input {...props} bind:value={$formData.locations[id].country} placeholder="Ex: Brasil" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`locations[${id}].extent_ha`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Extensão (Hectares)</Form.Label>
								<Input {...props} bind:value={$formData.locations[id].extent_ha} type="number" step="0.01" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`locations[${id}].position`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Posição / Coordenadas</Form.Label>
								<Input onchange={(event) => handleFileUpload(event, id)} type="file" accept=".json" placeholder="Ex:" class="p-0 rounded-md cursor-pointer text-xs text-muted-foreground bg-background file:h-full file:bg-secondary file:text-secondary-foreground file:border-0 file:px-4 file:mr-4 file:hover:bg-secondary/80 file:transition-colors file:items-center" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/snippet}
			</FormFieldWrapper>

			<Form.Field {form} name="locations">
				<Form.FieldErrors />
			</Form.Field>

			<FormFieldWrapper
				title="Atividades do Projeto"
				items={$formData.activities}
				itemTitlePrefix="Atividade"
				addLabel="+ Nova Atividade"
				onAdd={addActivity}
				onRemove={removeActivity}
			>
				{#snippet children(id)}
					<Form.Field {form} name={`activities[${id}].name`} class="w-7/12">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Nome</Form.Label>
								<Input {...props} bind:value={$formData.activities[id].name} placeholder="Ex: Remoção de resíduos sólidos" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`activities[${id}].description`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Descrição</Form.Label>
								<Textarea 
									{...props} 
									bind:value={$formData.activities[id].description} 
									placeholder="Descreva a atividade em detalhes" 
									class="rounded-md w-full min-h-10"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`activities[${id}].justification`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Justificativa</Form.Label>
								<Textarea 
									{...props} 
									bind:value={$formData.activities[id].justification} 
									placeholder="Por que esta atividade é necessária?" 
									class="rounded-md w-full min-h-10"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`activities[${id}].location_ids`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Localizações da Atividade</Form.Label>
									<Form.Description class="mb-4 text-xs">
										Clique sobre uma localização para vinculá-la à atividade.
									</Form.Description>
											
								{#if $formData.locations.length === 0}
									<div class="p-3 border border-dashed rounded-md bg-muted/50 text-xs text-destructive mt-1">
										Nenhuma localização cadastrada. Adicione pelo menos uma localização na seção Localizações do Projeto.
									</div>
								{:else}
									<div class="flex flex-wrap gap-2 mt-1">
										{#each $formData.locations as l (l.id)}
											{@const isSelected = $formData.activities[id].location_ids.includes(l.id)}
											
											<Button
												type="button"
												variant="outline"
												class={cn(
													"text-xs h-8 px-3 transition-all",
													isSelected 
														? "border border-black font-semibold shadow-sm scale-[1.02]" 
														: "opacity-50 hover:opacity-100"
												)}
												onclick={() => {
													if (isSelected) {
														$formData.activities[id].location_ids = $formData.activities[id].location_ids.filter(lId => lId !== l.id);
													} else {
														$formData.activities[id].location_ids = [...$formData.activities[id].location_ids, l.id];
													}
												}}
											>
												{l.ecosystem || 'Novo Local'}
												{#if isSelected}
													<div class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md">
														<X class="w-3 h-3" strokeWidth={2} />
													</div>
												{/if}
											</Button>
										{/each}
									</div>
								{/if}								
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/snippet}
			</FormFieldWrapper>

			<Form.Field {form} name="activities">
				<Form.FieldErrors />
			</Form.Field>

			<FormFieldWrapper
				title="Indicadores do Projeto"
				items={$formData.indicators}
				itemTitlePrefix="Indicador"
				addLabel="+ Novo Indicador"
				onAdd={addIndicator}
				onRemove={removeIndicator}
			>
				{#snippet children(id)}
					<Form.Field {form} name={`indicators[${id}].name`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Nome do Indicador</Form.Label>
								<Input {...props} bind:value={$formData.indicators[id].name} placeholder="Ex: Número de árvores plantadas" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].unit`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Unidade</Form.Label>
								<Input {...props} bind:value={$formData.indicators[id].unit} placeholder="Ex: ha, unidades, %" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].location_id`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Localização</Form.Label>
								<Select.Root type="single" {...props} bind:value={$formData.indicators[id].location_id}>
									<Select.Trigger class="w-full">
										{$formData.locations.find(l => l.id === $formData.indicators[id].location_id)?.ecosystem || 'Selecione uma Localização'}
									</Select.Trigger>
									<Select.Content class="rounded-md max-h-60">
										{#each $formData.locations as l (l.id)}
											<Select.Item class="rounded-md" value={l.id}>
												{l.ecosystem ? l.ecosystem : `Local sem nome`}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].activity_id`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Atividade Vinculada</Form.Label>
								<Select.Root type="single" {...props} bind:value={$formData.indicators[id].activity_id}>
									<Select.Trigger class="w-full">
										{$formData.activities.find(a => a.id === $formData.indicators[id].activity_id)?.name || 'Selecione uma Atividade'}
									</Select.Trigger>
									<Select.Content class="rounded-md max-h-60">
										{#each $formData.activities as act (act.id)}
											<Select.Item class="rounded-md" value={act.id}>
												{act.name ? act.name : `Atividade sem nome`}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].value_baseline`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Valor Baseline</Form.Label>
								<Input {...props} bind:value={$formData.indicators[id].value_baseline} type="number" step="0.01" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].value_reference`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Valor de Referência (Meta)</Form.Label>
								<Input {...props} bind:value={$formData.indicators[id].value_reference} type="number" step="0.01" class="rounded-md" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].observation_method`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Método de Observação</Form.Label>
								<Textarea 
									{...props} 
									bind:value={$formData.indicators[id].observation_method} 
									placeholder="Como este indicador será medido?" 
									class="resize-none"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name={`indicators[${id}].justification`} class="field">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="text-xs">Justificativa</Form.Label>
								<Textarea 
									{...props} 
									bind:value={$formData.indicators[id].justification} 
									placeholder="Por que este indicador é relevante?" 
									class="resize-none"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				{/snippet}
			</FormFieldWrapper>

			<Form.Field {form} name="indicators">
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

	.dates-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	:global(.calendar) {
		align-self: flex-start;
	}

	.date-summary {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	:global(.form-footer) {
		padding-left: 0 !important;
		padding-right: 0 !important;
		padding-bottom: 0 !important;
	}

	:global(.field) {
		width: 100%;
		@media (width >= 48rem /* 768px */) {
        	width: calc(50% - 0.5rem /* 8px */);
    	}
	}
</style>
