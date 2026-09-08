import type { Component } from 'svelte';

// Tipos para Barra Lateral
export interface SidebarItem {
	title: string;
	url: string;
	icon: Component;
}

export interface SidebarProps {
	groupLabel?: string;
	items?: SidebarItem[];
}
