export type TodoItem = {
	flag: string;
	name: string;
	location: {
		file: string;
		line: number;
	};
	date?: {
		date: Date;
		has_time_of_day: boolean;
	};
	priority?: number;
};
