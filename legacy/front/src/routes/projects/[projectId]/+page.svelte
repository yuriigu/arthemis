<script lang="ts">
  import LineChart from '$lib/components/ui/chart/LineChart.svelte';
  import ObservationMap from '$lib/components/ui/map/ObservationMap.svelte';
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { SvelteMap } from 'svelte/reactivity';
  import type { PageData } from './$types';
  import type { Project } from '$lib/types';
  import type { ChartDataPoint, MapIndicator } from '$lib/components/ui/map/types.js';
  import type { Point } from 'geojson';

  let { data }: { data: PageData } = $props();
  const project = $derived(data.project as Project);

  const projectArea =  $derived(
    project.locations?.reduce((sum, l) => sum + (Number(l.extent_ha)), 0) || 0
  );

  const projectLocations = $derived(
    Array.from(new Set(project.locations?.map(l => `${l.country} (${l.ecosystem})`))).join('; ')
  );

  const projectIndicators = $derived(
    project.activities?.flatMap(activity => 
      (activity.indicators || []).map(indicator => ({
        ...indicator,
        activity_name: activity.name
      }))
    ) || []
  );

  let selectedActivityId = $state("");
  const selectedActivity = $derived(
    project.activities?.find(a => String(a.id) === selectedActivityId) || project.activities?.[0]
  );

  const selectedActivityIndicators = $derived<MapIndicator[]>((selectedActivity?.indicators || []).map((indicator, index) => ({
      ...indicator,
      id: String(indicator.id),
      color: generateColor(index)
    }))
  );

  let observations = $derived.by(() => {
    if (!selectedActivityIndicators) return [];
    
    return selectedActivityIndicators.flatMap(i => {
      if (!i.observations) return [];
      
      return i.observations.map(o => {
        const coordinates = structuredClone((o.position as Point)?.coordinates);        
        
        return {
          id: String(o.id),
          name: i.name,
          value: o.value,
          unit: i.unit,
          date: o.date,
          position: o.position,
          lng: coordinates?.[0] ?? 0, 
          lat: coordinates?.[1] ?? 0,
          color: i.color
        };
      });
    });
  });

  const chartEntries = $derived(
    selectedActivityIndicators?.map((selectedActivityIndicators) => ({
      key: selectedActivityIndicators.id,
      label: selectedActivityIndicators.name,
      color: selectedActivityIndicators.color
    }))
  );

  const chartData = $derived.by(() => {
    if (!selectedActivity) return [];

    const map = new SvelteMap<string, ChartDataPoint>();
    
    selectedActivityIndicators?.forEach(({ id, observations }) => {
      observations?.forEach((o) => {
        const dateKey = String(o.date)

        if (!map.has(dateKey)) {
          map.set(dateKey, { date: new Date(dateKey) });
        }

        map.get(dateKey)![id] = o.value;
      });
    });
    
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  function generateColor(index: number) {
    const baseHue = 120; // green
    const hueShift = 45;
    const newHue = (baseHue + (index * hueShift)) % 360;
    return `hsl(${newHue}, 70%, 45%)`
  }
</script>

<div class="page-wrapper pt-8 pb-8 px-6 bg-card border border-gray-200 dark:border-gray-800 shadow-sm">
  <header class="page-header">
    <h1 class="project-title text-foreground">{project.name}</h1>
    
    <div class="project-info">
      <p class="text-muted-foreground"><span class="font-medium text-foreground">Duração:</span>
        {new Date(project.lifetime_start).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} 
        até 
        {new Date(project.lifetime_end).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
      </p>
      <p class="text-muted-foreground"><span class="font-medium text-foreground">Localização:</span> {projectLocations}</p>
      <p class="text-muted-foreground"><span class="font-medium text-foreground">Área Total:</span> {projectArea} ha</p>
    </div>

    <div class="sdg-container">
      {#each project.project_sdgs as s (s.id)}
        <img src={s.icon_url} alt={s.name} title={s.name} class="sdg-icon" />
      {/each}
    </div>
  </header>

  <Separator class="my-6" />

  <div class="listing-wrapper">
    <div class="tabs-wrapper">
        <h2 class="title text-foreground">Detalhes do Projeto</h2>
        <Tabs.Root value="activities" class="w-full">
          
          <Tabs.List class="grid w-full grid-cols-4 mb-1">
            <Tabs.Trigger value="activities">Atividades</Tabs.Trigger>
            <Tabs.Trigger value="locations">Localizações</Tabs.Trigger>
            <Tabs.Trigger value="indicators">Indicadores</Tabs.Trigger>
            <Tabs.Trigger value="observations">Observações</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="activities">
            <Card.Root class="tabs-card">
              <Card.Header>
                <Card.Title>Atividades</Card.Title>
                <Card.Description>Todas as atividades registradas para este projeto.</Card.Description>
              </Card.Header>
              <Card.Content>
                <ScrollArea class="scroll-area border border-gray-200 dark:border-gray-800">
                  <div class="flex flex-col gap-4">
                    {#each project.activities || [] as a (a.id)}
                      <Card.Root class="tabs-card">
                        <Card.Header class="pb-2">
                          <Card.Title class="text-lg">{a.name}</Card.Title>
                        </Card.Header>
                        <Card.Content>
                          {#if a.description}
                            <p class="text-sm text-muted-foreground mb-1"><span class="font-medium text-foreground">Descrição:</span> {a.description}</p>
                          {/if}

                          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-6">
                            
                            <div class="w-full">
                              <h3 class="text-sm font-medium text-foreground mb-2">Localizações</h3>
                              {#if a.activity_locations && a.activity_locations.length > 0}
                                <div class="border border-gray-200 dark:border-gray-800 rounded-md">
                                  <Table.Root class="table-fixed w-full">
                                    <Table.Header>
                                      <Table.Row>
                                        <Table.Head class="w-1/3">País</Table.Head>
                                        <Table.Head class="w-1/3">Ecossistema</Table.Head>
                                        <Table.Head class="w-1/3 text-right">Área</Table.Head>
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                      {#each a.activity_locations as loc (loc.id)}
                                        <Table.Row>
                                          <Table.Cell>{loc.country}</Table.Cell>
                                          <Table.Cell>{loc.ecosystem}</Table.Cell>
                                          <Table.Cell class="text-right">{loc.extent_ha} ha</Table.Cell>
                                        </Table.Row>
                                      {/each}
                                    </Table.Body>
                                  </Table.Root>
                                </div>
                              {:else}
                                <p class="text-sm text-muted-foreground italic">Nenhuma localização vinculada.</p>
                              {/if}
                            </div>

                            <div class="w-full">
                              <h3 class="text-sm font-medium text-foreground mb-2">Indicadores</h3>
                              {#if a.indicators && a.indicators.length > 0}
                                <div class="border border-gray-200 dark:border-gray-800 rounded-md">
                                  <Table.Root class="table-fixed w-full">
                                    <Table.Header>
                                      <Table.Row>
                                        <Table.Head class="w-1/2">Nome</Table.Head>
                                        <Table.Head class="w-1/2 text-right">Unidade</Table.Head>
                                      </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                      {#each a.indicators as ind (ind.id)}
                                        <Table.Row>
                                          <Table.Cell>{ind.name}</Table.Cell>
                                          <Table.Cell class="text-right">{ind.unit}</Table.Cell>
                                        </Table.Row>
                                      {/each}
                                    </Table.Body>
                                  </Table.Root>
                                </div>
                              {:else}
                                <p class="text-sm text-muted-foreground italic">Nenhum indicador vinculado.</p>
                              {/if}
                            </div>
                            
                          </div>

                        </Card.Content>
                      </Card.Root>
                    {:else}
                      <p class="text-sm text-muted-foreground">Nenhuma atividade encontrada.</p>
                    {/each}
                  </div>
                </ScrollArea>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="locations">
            <Card.Root class="tabs-card">
              <Card.Header>
                <Card.Title>Localizações</Card.Title>
                <Card.Description>Localizações abrangidas pelo projeto.</Card.Description>
              </Card.Header>
              <Card.Content>
                <ScrollArea class="scroll-area border border-gray-200 dark:border-gray-800">
                  <div class="flex flex-col gap-4">
                    {#each project.locations || [] as l (l.id)}
                      <Card.Root class="tabs-card">
                        <Card.Header class="pb-2">
                          <Card.Title class="text-lg">{l.country} - {l.ecosystem}</Card.Title>
                        </Card.Header>
                        <Card.Content>
                          <p class="text-sm text-muted-foreground"><span class="font-medium text-foreground">Área:</span> {l.extent_ha} hectares</p>
                        </Card.Content>
                      </Card.Root>
                    {:else}
                      <p class="text-sm text-muted-foreground">Nenhuma localização encontrada.</p>
                    {/each}
                  </div>
                </ScrollArea>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="indicators">
            <Card.Root class="tabs-card">
              <Card.Header>
                <Card.Title>Indicadores</Card.Title>
                <Card.Description>Indicadores associados às atividades do projeto.</Card.Description>
              </Card.Header>
              <Card.Content>
                <ScrollArea class="scroll-area border border-gray-200 dark:border-gray-800">
                  <div class="flex flex-col gap-4">
                    {#each projectIndicators || [] as i (i.id)}
                      <Card.Root class="tabs-card">
                        <Card.Header class="pb-2">
                          <Card.Title class="text-lg">{i.name}</Card.Title>
                        </Card.Header>
                        <Card.Content>
                          <div class="grid grid-cols-2 gap-2 text-sm">
                            <p class="text-muted-foreground"><span class="font-medium text-foreground">Atividade:</span> {i.activity_name}</p>
                            <p class="text-muted-foreground"><span class="font-medium text-foreground">Unidade:</span> {i.unit}</p>
                            <p class="text-muted-foreground"><span class="font-medium text-foreground">Valor Base:</span> {i.value_baseline}</p>
                            <p class="text-muted-foreground"><span class="font-medium text-foreground">Valor de Referência:</span> {i.value_reference}</p>
                            <p class="text-muted-foreground"><span class="font-medium text-foreground">Método:</span> {i.observation_method}</p>
                          </div>
                        </Card.Content>
                      </Card.Root>
                    {:else}
                      <p class="text-sm text-muted-foreground">Nenhum indicador encontrado.</p>
                    {/each}
                  </div>
                </ScrollArea>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

          <Tabs.Content value="observations">
            <Card.Root class="tabs-card">
              <Card.Header>
                <Card.Title>Observações</Card.Title>
                <Card.Description>Dados coletados durante a vigência do projeto.</Card.Description>
              </Card.Header>
              <Card.Content>
                <ScrollArea class="scroll-area border border-gray-200 dark:border-gray-800">
                  <div class="flex flex-col gap-4">
                    {#each observations as o (o.id)}
                      <Card.Root class="tabs-card border-l-4" style="border-left-color: {o.color};">
                        <Card.Header class="pb-2">
                          <div class="flex justify-between items-start">
                            <Card.Title class="text-base font-semibold">{o.name}</Card.Title>
                            <span class="text-xs text-muted-foreground">{new Date(o.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                          </div>
                        </Card.Header>
                        <Card.Content>
                          <p class="text-sm text-muted-foreground">
                            <span class="font-medium text-foreground">Valor Registrado:</span> {o.value} <span class="text-xs font-medium text-muted-foreground">{o.unit}</span>
                          </p>
                        </Card.Content>
                      </Card.Root>
                    {:else}
                      <p class="text-sm text-muted-foreground">Nenhuma observação registrada ainda.</p>
                    {/each}
                  </div>
                </ScrollArea>
              </Card.Content>
            </Card.Root>
          </Tabs.Content>

        </Tabs.Root>
      </div>
  </div>
  
  <div class="activity-card tabs-card">
    <Select.Root type="single" name="selectedActivity" bind:value={selectedActivityId}>
      <h2 class="title text-foreground">Monitoramento de Atividade</h2>
      <Select.Trigger class="rounded-md w-[40%] border-gray-200 dark:border-gray-800">
        {#if selectedActivity} 
          {selectedActivity.name} 
        {:else} 
          Selecione uma atividade
        {/if}
      </Select.Trigger>
      <Select.Content class="rounded-md border-gray-200 dark:border-gray-800">
        <Select.Group>
          {#each project.activities as activity (activity.id)}
            <Select.Item value={String(activity.id)} label={activity.name} class="rounded-md">
              {activity.name}
            </Select.Item>
          {/each}
        </Select.Group>
      </Select.Content>
    </Select.Root>

    {#if selectedActivity}
      <div class="chart-wrapper">
        <LineChart
          title="Evolução das Atividades"
          description="Observações pelo tempo para {selectedActivity.name}"
          data={chartData}
          series={chartEntries}
          class="line-card shadow-none"
          dotted={true}
        />
      </div>
    
      <div class="map-wrapper">
        <ObservationMap locations={selectedActivity.activity_locations} observations={observations}/>
      </div> 
    {/if} 
  </div>
</div>

<style>
  .page-wrapper {
    min-height: 100%;
    gap: 1.5rem;
    margin: 32px; /* <-- Atualizado para igualar a página de formulário */
    border-radius: 5px;
    font-family: system-ui, sans-serif;
  }

  .page-header {
    margin-bottom: 1rem;
  }

  .project-title {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .project-info {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .project-info p {
    margin: 0;
  }

  .sdg-container {
    display: flex;
    gap: 0.75rem; 
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .sdg-icon {
    width: 6rem; 
    height: auto; 
    object-fit: cover;
    border-radius: 0.25rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    transition: transform 0.2s ease-in-out;
  }

  .activity-card, .tabs-card {
    padding: 1rem;
  }

  :global(.scroll-area) {
    height: 400px;
    width: 100%;
    border-radius: 0.375rem;
    padding: 1rem;
    background-color: transparent;
  }

  .chart-wrapper,
  .map-wrapper,
  .tabs-wrapper {
    width: 100%;
    margin-top: 2.5rem;
  }

  .activity-card.tabs-card {
    margin-top: 2.5rem; 
  }

  .title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }
</style>
