export type TodoItem = {
	flag: string;
	name: string;
	location: {
		file: string;
		line: number;
	};
	date?: Time;
	priority?: number;
};

export type Time = {
	date: Date;
	has_time_of_day: boolean;
	until?: Date;
};

export function time_now(has_time_of_day: boolean): Time {
	const now = new Date();
	return {
		date: now,
		has_time_of_day,
	};
}
