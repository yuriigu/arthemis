// Tipos para Gráfico de Linhas
export interface LineChartDataPoint {
	date: Date;
}

export interface LineChartSeries {
	key: string;
	label: string;
	color: string;
}

export interface LineChartProps {
	title: string;
	description?: string;
	data: LineChartDataPoint[];
	series: LineChartSeries[];
	footerTitle?: string;
	footerDescription?: string;
	selectedPeriod?: string;
	periodOptions?: readonly string[];
	onPeriodChange?: (period: string) => void;
	class?: string;
	dotted?: boolean;
}

// Tipos para Gráfico de Pizza
export interface PieChartSlice {
	label: string;
	value: number;
	color: string;
}

export interface PieChartProps {
	title: string;
	description?: string;
	slices: PieChartSlice[];
	footerTitle?: string;
	footerDescription?: string;
	class?: string;
}

// Tipos para Dados (usados nos gráficos de linhas)
export interface DataPoint {
    date: Date;
    impacto: number;
    credito: number;
}
