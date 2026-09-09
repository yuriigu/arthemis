<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import RecordActions from '$lib/components/RecordActions.svelte';
	import type { UserRecord, ProponentRecord } from '$lib/types.js';

	let {
		users,
		proponents
	}: {
		users: UserRecord[];
		proponents: ProponentRecord[];
	} = $props();

	let searchQuery = $state('');

	const roles = [
		{ value: 'admin', label: 'Administrador' },
		{ value: 'manager', label: 'Gerente' },
		{ value: 'visitor', label: 'Visitante' }
	] as const;

	let filteredUsers = $derived(
		users.filter((user) => {
			const query = searchQuery.trim().toLowerCase();
			if (!query) return true;
			return (
				user.id.toLowerCase().includes(query) ||
				user.username.toLowerCase().includes(query) ||
				user.email.toLowerCase().includes(query) ||
				user.role.toLowerCase().includes(query) ||
				user.proponentName.toLowerCase().includes(query)
			);
		})
	);
</script>

<div class="list-container">
	<div class="list-header-row">
		<div class="search-wrap">
			<Input
				type="text"
				placeholder="Buscar usuários por ID, nome, e-mail, perfil ou organização..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>
		<span class="count-tag">
			{filteredUsers.length} de {users.length} registro(s)
		</span>
	</div>

	{#if filteredUsers.length === 0}
		<p class="empty-state">Nenhum usuário cadastrado ou encontrado para a busca.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Usuário</th>
						<th>Dados</th>
						<th>Ações</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredUsers as user (user.id)}
						<tr>
							<td>
								<strong>{user.username}</strong>
								<span>{user.id}</span>
							</td>
							<td>
								<form method="POST" action="/users?/update" class="row-form" id={`user-${user.id}`}>
									<input type="hidden" name="id" value={user.id} />
									<label>
										<span>Organização</span>
										<select name="proponent_id" required value={user.proponentId}>
											{#each proponents as proponent (proponent.id)}
												<option value={proponent.id}>{proponent.name}</option>
											{/each}
										</select>
									</label>
									<label>
										<span>Usuário</span>
										<Input name="username" value={user.username} required maxlength={150} />
									</label>
									<label>
										<span>E-mail</span>
										<Input name="email" type="email" value={user.email} required maxlength={150} />
									</label>
									<label>
										<span>Perfil</span>
										<select name="role" required value={user.role}>
											{#each roles as role (role.value)}
												<option value={role.value}>{role.label}</option>
											{/each}
										</select>
									</label>
								</form>
							</td>
							<td class="actions-cell">
								<RecordActions
									updateFormId={`user-${user.id}`}
									deleteId={user.id}
									deleteAction="/users?/delete"
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.list-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.list-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.search-wrap {
		flex: 1;
		min-width: 280px;
	}

	:global(.search-input) {
		width: 100%;
	}

	.count-tag {
		font-size: 0.875rem;
		color: var(--muted-foreground);
	}

	.empty-state {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
		padding: 24px 0;
		text-align: center;
	}

	td strong,
	td span {
		display: block;
	}

	td span {
		font-size: 0.875rem;
		color: var(--muted-foreground);
		margin: 0;
	}

	.row-form {
		display: grid;
		grid-template-columns: repeat(4, minmax(140px, 1fr));
		gap: 10px;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}

	select {
		height: 36px;
		width: 100%;
		border: 1px solid transparent;
		border-radius: 18px;
		background: color-mix(in srgb, var(--foreground) 6%, transparent);
		color: var(--foreground);
		padding: 0 12px;
	}

	.table-wrap {
		overflow-x: auto;
		width: 100%;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 10px 8px;
		border-bottom: 1px solid var(--border);
		text-align: left;
		vertical-align: bottom;
	}

	th {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		font-weight: 600;
	}

	.actions-cell {
		width: 158px;
		min-width: 158px;
		white-space: nowrap;
		vertical-align: middle;
	}

	@media (max-width: 900px) {
		.row-form {
			grid-template-columns: 1fr;
		}
	}
</style>
