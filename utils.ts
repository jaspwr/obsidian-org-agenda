import { Time } from "types";

export const flag_colour = (flag: string): string => {
	const RED = "var(--color-red)";
	const GREEN = "var(--color-green)";
	const YELLOW = "var(--color-yellow)";

	switch (flag) {
		case "TODO":
			return RED;
		case "DONE":
			return GREEN;
		case "WAITING":
			return YELLOW;
		case "CANCELLED":
			return RED;
		case "BLOCKED":
			return RED;
		case "DEADLINE":
			return RED;
		case "POSTPONED":
			return YELLOW;
		default:
			return "var(--text-normal)";
	}
}

export const format_time = (time: Date): string => {
	const hour = time.getHours().toString().padStart(2, "0");
	const min = time.getMinutes().toString().padStart(2, "0");
	return `${hour}:${min}`;
};

export function time_now(has_time_of_day: boolean): Time {
	const now = new Date();
	return {
		date: now,
		has_time_of_day,
	};
}

export const priority_cmp = (a: string, b: string): number => {
	const priority_order = ["D", "#C", "#B", "#A"];
	const a_index = priority_order.indexOf(a);
	const b_index = priority_order.indexOf(b);
	return a_index - b_index;
}
