<script lang="ts" generics="T  extends { id: string }">
    import { Label } from '$lib/components/ui/label/index.js';
    import * as Card from '$lib/components/ui/card/index.js';
    import { Button } from '$lib/components/ui/button/index.js';
	import type { FormFieldWrapperProps } from './types';

    let {
        title,
        items,
        itemTitlePrefix = 'Item',
        addLabel = 'Adicionar',
        onAdd,
        onRemove,
        children
    }: FormFieldWrapperProps<T> = $props();
</script>

<div class="flex flex-col gap-4">
    <Label>{title}</Label>

    {#each items as item, id (item.id)}
        <Card.Root class="relative">
            <Card.Header class="flex flex-row justify-between">
                <Card.Title class="text-xs">
                    {itemTitlePrefix} #{id + 1}
                </Card.Title>
                <Button type="button" variant="destructive" size="icon" class="h-8 w-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer" onclick={() => onRemove(id)}>
                    ✕
                </Button>
            </Card.Header>
            
            <Card.Content>
                <div class="flex flex-row flex-wrap gap-4">
                    {@render children(id)}
                </div>
            </Card.Content>
        </Card.Root>
    {/each}

    <Button type="button" variant="outline" size="sm" class="self-start" onclick={onAdd}>
        {addLabel}
    </Button>
</div>
