import { Time, TodoItem } from "./types";
import moment from "moment";

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

export function priority_cmp(a?: string, b?: string): number {
	const priority_order = ["D", "#C", "#B", "#A"];
	const a_index = a !== undefined ? priority_order.indexOf(a) : -1;
	const b_index = b !== undefined ? priority_order.indexOf(b) : -1;
	return a_index - b_index;
};

export function occurs_on_day(todo: TodoItem, day: number) {
	if (!todo.date) return false;

	if (todo.date.recurrence !== undefined) {
		if (day < todo.date?.date.valueOf() ?? 0) return;

		// todo_day + n * todo.recurring == day
		// n * todo.recurring == day - todo_day
		// n == (day - todo_day) / todo.recurring
		// n must be an integer
		
		const d1_moment = moment(todo.date.date);
		const d2_moment = moment(day);
		const diff = d1_moment.diff(d2_moment, "days");

		return diff % todo.date.recurrence === 0;
	}

	const todo_day = new Date(todo.date?.date);
	todo_day.setHours(0, 0, 0, 0);

	return todo_day.valueOf() === day;
};

