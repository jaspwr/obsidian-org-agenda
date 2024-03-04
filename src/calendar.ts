import { get } from 'svelte/store';
import { Time } from './types';

export const day_in_month = (row: number, col: number, month: Date) => {
	const cal_pos = row * 7 + col + 1;

	const first_day = new Date(
		month.getFullYear(),
		month.getMonth(),
		1,
	).getDay();

	const last_day = new Date(
		month.getFullYear(),
		month.getMonth() + 1,
		0,
	).getDate();

	const prev_last_day = new Date(
		month.getFullYear(),
		month.getMonth(),
		0,
	).getDate();

	let day = cal_pos - first_day;
	let in_month = true;

	let date = new Date(month.getFullYear(), month.getMonth(), day);

	if (day < 1) {
		day = prev_last_day + day;
		in_month = false;
	} else if (day > last_day) {
		day = day - last_day;
		in_month = false;
	}

	let today = new Date(Date.now());
	today.setHours(0, 0, 0, 0);
	const is_today = date.valueOf() === today.valueOf();

	return {
		day,
		date,
		in_month,
		is_today,
	};
};


export const shift_by_days = (date: Date, days: number): Date => {
	const new_date = new Date(date);
	new_date.setDate(new_date.getDate() + days);
	return new_date;
};

export const shift_by_months = (date: Date, months: number): Date => {
	const new_date = new Date(date);
	new_date.setMonth(new_date.getMonth() + months);
	return new_date;
};

export const to_time = (date: Date): Time => {
	return {
		date: date,
		has_time_of_day: false,
	};
};

export const keypress = (selected: any, on_select: (time: Time) => void) => (e: KeyboardEvent) => {
	const selected_value: Date = get(selected);

	// https://orgmode.org/manual/The-date_002ftime-prompt.html#FOOT61
	if (e.key === "Enter") {
		on_select(to_time(selected_value));
		return;
	}

	if (e.key === "ArrowRight") {
		selected.set(shift_by_days(selected_value, 1));
	} else if (e.key === "ArrowLeft") {
		selected.set(shift_by_days(selected_value, -1));
	} else if (e.key === "ArrowUp") {
		selected.set(shift_by_days(selected_value, -7));
	} else if (e.key === "ArrowDown") {
		selected.set(shift_by_days(selected_value, 7));
	}

	if (e.ctrlKey && e.key === ".") {
		const new_selected = new Date(Date.now());
		new_selected.setHours(0, 0, 0, 0);
		selected.set(new_selected);
	}

	if (e.key === ">") {
		selected.set(shift_by_months(selected_value, 1));
	}

	if (e.key === "<") {
		selected.set(shift_by_months(selected_value, -1));
	}

	if (e.ctrlKey && e.key === "v") {
		selected.set(shift_by_months(selected_value, -3));
	}
};
