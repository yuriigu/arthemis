<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/ui/sidebar/AppSidebar.svelte';
	import { Button } from "$lib/components/ui/button/index.js";
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toggleMode } from "mode-watcher";
	import { ModeWatcher } from 'mode-watcher';
	import SunIcon from "@lucide/svelte/icons/sun";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import { page } from '$app/stores';

	let sidebarOpen = $state(true);
	let { children } = $props();

	let isLoginPage = $derived($page.url.pathname === '/login');
</script>

<ModeWatcher />
<Toaster />

{#if isLoginPage}
	<div class="bg-background text-foreground flex h-screen w-full overflow-hidden">
		<main class="flex flex-1 flex-col">
			{@render children()}
		</main>
	</div>
{:else}
	<Sidebar.Provider bind:open={sidebarOpen}>
		<div class="bg-background text-foreground flex h-screen w-full overflow-hidden">
			<AppSidebar />
			{#if !sidebarOpen}
				<div class="sidebar-collapsed-trigger">
					<Sidebar.Trigger />
				</div>
			{/if}
			<div class="flex flex-1 flex-col overflow-auto relative">
				<div class="absolute top-4 right-4 z-50">
					<Button onclick={toggleMode} variant="outline" size="icon">
						<SunIcon
							class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
						/>
						<MoonIcon
							class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
						/>
						<span class="sr-only">Toggle theme</span>
					</Button>
				</div>
				<main class="pt-16 flex flex-1 flex-col">
					{@render children()}
				</main>
			</div>
		</div>
	</Sidebar.Provider>
{/if}

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<style>
	.sidebar-collapsed-trigger {
		width: 3rem;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 0.75rem;
		border-right: 1px solid var(--border);
		background: var(--sidebar);
		flex-shrink: 0;
	}
</style>
