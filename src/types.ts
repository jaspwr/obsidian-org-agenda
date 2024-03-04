export type TodoItem = {
	flag: string;
	name: string;
	location: {
		file: string;
		line: number;
	};
	date?: Time;
	priority?: string;
};

/**
* @member recurrence - The number of days between each recurrence.
*/ 
export type Time = {
	date: Date;
	has_time_of_day: boolean;
	until?: Date;
	recurrence?: number;
};

export enum AgendaViewType {
	DailyWeekly,
	GlobalTODO,
	Calendar,
	ByTags,
	Search,
	Stuck,
};

export type DailyWeeklyView = {
	type: AgendaViewType.DailyWeekly;
	date: Date;
	days_after_showing: number;
	days_before_showing: number;
};

export type GlobalTODOView = {
	type: AgendaViewType.GlobalTODO;
};

export type CalendarView = {
	type: AgendaViewType.Calendar;
	month: Date;
};

export type AgendaView = DailyWeeklyView | GlobalTODOView | CalendarView;
