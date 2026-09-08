<script lang="ts">
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import FolderKanbanIcon from '@lucide/svelte/icons/folder-kanban';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import SearchIcon from '@lucide/svelte/icons/search';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { SidebarItem, SidebarProps } from '$lib/components/ui/sidebar/types';

	const defaultItems: SidebarItem[] = [
		{
			title: 'Dashboard',
			url: '/',
			icon: LayoutDashboardIcon
		},
		{
			title: 'Busca Geral',
			url: '/search',
			icon: SearchIcon
		},
		{
			title: 'Organizações',
			url: '/organizations',
			icon: Building2Icon
		},
		{
			title: 'Projetos',
			url: '/projects',
			icon: FolderKanbanIcon
		},
		{
			title: 'Observações',
			url: '/observations',
			icon: EyeIcon
		},
		{
			title: 'Usuários',
			url: '/users',
			icon: UsersIcon
		},
		{
			title: 'Login',
			url: '/login',
			icon: LogInIcon
		}
	];

	let { groupLabel = 'Arthemis', items = defaultItems }: SidebarProps = $props();
</script>

<Sidebar.Root>
	<Sidebar.Header class="sidebar-header">
		<div class="sidebar-header-row">
			<Sidebar.GroupLabel class="sidebar-group-label">{groupLabel}</Sidebar.GroupLabel>
			<Sidebar.Trigger class="sidebar-trigger" />
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each items as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton class="sidebar-menu-button">
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>

<style>
	.sidebar-header {
		padding-bottom: 0.5rem;
		padding-top: 1rem;
	}

	.sidebar-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
	}

	:global(.sidebar-group-label) {
		margin-right: auto;
		padding-left: 0.5rem;
		font-family: var(--font-serif);
		font-size: 1.75rem !important;
		font-weight: 700 !important;
		color: var(--sidebar-foreground) !important;
		letter-spacing: -0.03em;
		height: auto !important;
		text-transform: none !important;
		padding-bottom: 0.3rem;
	}

	:global(.sidebar-trigger) {
		margin-left: auto;
		flex-shrink: 0;
	}

	:global(.sidebar-menu-button) {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-family: var(--font-sans);
		font-size: 1.0rem !important;
		font-weight: 500;
		color: var(--sidebar-foreground);
	}
</style>
