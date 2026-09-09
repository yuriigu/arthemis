import type { SuperValidated, Infer } from 'sveltekit-superforms';
import type { Snippet } from 'svelte';
import type { ProponentSchema } from './ProponentFormschema.js';
import type { ProjectSchema } from './ProjectFormSchema.js';
import type { UserSchema } from './UserFormSchema.js';
import type { UserLoginSchema } from './UserLoginSchema.js';
import type { ObservationSchema } from './ObservationFormSchema.js';

// Props para o wrapper utilizado no formulário dos Projetos
export interface FormFieldWrapperProps<T extends { id: string }> {
        title: string;
        items: T[]; 
        itemTitlePrefix?: string;
        addLabel?: string;
        onAdd: () => void;
        onRemove: (index: number) => void;
        children: Snippet<[number]>;
}

// Props para os componentes do formulário das Organizações
export interface ProponentFormProps {
	// Dados do formulário vindos do load function via superValidate
	data: SuperValidated<Infer<ProponentSchema>>;
	// Título exibido no card do formulário
	title?: string;
	// Subtítulo/descrição exibida abaixo do título
	description?: string;
	// Texto do botão de submit
	submitLabel?: string;
	// Classe CSS adicional para o card externo
	class?: string;
}

// Props para os componentes do formulário dos Projetos

// Proponente disponível para seleção no formulário.
// Vem do load() do +page.server.ts, buscado do banco.
export interface ProponentOption {
	id: string;
	name: string;
}

export interface SdgOption {
	id: string;
	name: string;
	number: number;
	iconUrl: string
}

export interface ProjectFormProps {
	// Dados do formulário vindos do load() via superValidate
	data: SuperValidated<Infer<ProjectSchema>>;
	// Lista de proponentes para o campo de seleção
	proponents: ProponentOption[];
	// Lista de ODS para o campo de seleção
	sdgs: SdgOption[];
	// Título exibido no card do formulário
	title?: string;
	// Subtítulo/descrição exibida abaixo do título
	description?: string;
	// Texto do botão de submit
	submitLabel?: string;
	// Classe CSS adicional para o card externo
	class?: string;
}

// Props para os componentes do formulário do Cadastro de Usuário
export interface UserFormProps {
	// Dados do formulário vindos do load() via superValidate
	data: SuperValidated<Infer<UserSchema>>;
	// Lista de proponentes para o campo de seleção
	proponents: ProponentOption[];
	// Título exibido no card do formulário
	title?: string;
	// Subtítulo/descrição exibida abaixo do título
	description?: string;
	// Texto do botão de submit
	submitLabel?: string;
	// Classe CSS adicional para o card externo
	class?: string;
}

// Props para os componentes do formulário do Login de Usuário
export interface UserLoginProps {
	// Dados do formulário vindos do load() via superValidate
	data: SuperValidated<Infer<UserLoginSchema>>;
	// Título exibido no card do formulário
	title?: string;
	// Subtítulo/descrição exibida abaixo do título
	description?: string;
	// Texto do botão de submit
	submitLabel?: string;
	// Classe CSS adicional para o card externo
	class?: string;
}

export interface IndicatorOption {
	/** Identificador único convertido para string. */
	id: string;
	/** Nome de exibição do indicador. */
	name: string;
}

// Props para os componentes do formulário das Observações
export interface ObservationProps {
	// Dados do formulário vindos do load() via superValidate
	data: SuperValidated<Infer<ObservationSchema>>;
	// Lista de indicadores para o campo de seleção
	indicators: IndicatorOption[];
	// Título exibido no card do formulário
	title?: string;
	// Subtítulo/descrição exibida abaixo do título
	description?: string;
	// Texto do botão de submit
	submitLabel?: string;
	// Classe CSS adicional para o card externo
	class?: string;
}
