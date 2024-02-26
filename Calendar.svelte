<script>
	import { time_now } from "./utils";

	export let on_select;
	export let inital_date = time_now(false);

	if (inital_date.has_time_of_day === true) {
		let hours = inital_date.date.getHours();
		let minutes = inital_date.date.getMinutes();

		let old_on_select = on_select.bind({});

		on_select = (time) => {
			time.date.setHours(hours, minutes, 0, 0);
			time.has_time_of_day = true;
			old_on_select(time);
		};
	}

	const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const day_in_month = (cal_pos, month) => {
		const first_day = new Date(
			month.getFullYear(),
			month.getMonth() + 1,
			0,
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

	let selected = inital_date.date;
	selected.setHours(0, 0, 0, 0);

	const shift_by_days = (date, days) => {
		const new_date = new Date(date);
		new_date.setDate(new_date.getDate() + days);
		return new_date;
	};

	const shift_by_months = (date, months) => {
		const new_date = new Date(date);
		new_date.setMonth(new_date.getMonth() + months);
		return new_date;
	};

	const to_time = (date) => {
		return {
			date: date,
			has_time_of_day: false,
		};
	};

	const keypress = (e) => {
		// https://orgmode.org/manual/The-date_002ftime-prompt.html#FOOT61
		if (e.key === "Enter") {
			on_select(to_time(selected));
			return;
		}

		if (e.key === "ArrowRight") {
			selected = shift_by_days(selected, 1);
		} else if (e.key === "ArrowLeft") {
			selected = shift_by_days(selected, -1);
		} else if (e.key === "ArrowUp") {
			selected = shift_by_days(selected, -7);
		} else if (e.key === "ArrowDown") {
			selected = shift_by_days(selected, 7);
		}

		if (e.ctrlKey && e.key === ".") {
			selected = new Date(Date.now());
			selected.setHours(0, 0, 0, 0);
		}

		if (e.key === ">") {
			selected = shift_by_months(selected, 1);
		}

		if (e.key === "<") {
			selected = shift_by_months(selected, -1);
		}

		if (e.ctrlKey && e.key === "v") {
			selected = shift_by_months(selected, -3);
		}
	};

	$: month = new Date(selected);
</script>

<div class="calendar">
	<div class="calendar-top">
		<span></span>
		<button
			on:click={() => {
				month.setMonth(month.getMonth() - 1);
				month = new Date(month);
			}}>Prev</button
		>
		<span class="date-name">
			{month.toLocaleString("default", { month: "long" })}
			{month.getFullYear()}
		</span>
		<button
			on:click={() => {
				month.setMonth(month.getMonth() + 1);
				month = new Date(month);
			}}>Next</button
		>
		<span></span>
	</div>

	<table>
		<tr>
			{#each DAYS as day}
				<th>{day}</th>
			{/each}
		</tr>
		{#each Array(6) as _, i}
			<tr>
				{#each Array(7) as col, j}
					<td>
						<button
							class={`day-button ${
								day_in_month(i * 7 + j + 1, month).in_month
									? ""
									: "other-month"
							} ${
								day_in_month(i * 7 + j + 1, month).is_today
									? "today"
									: ""
							} ${
								day_in_month(
									i * 7 + j + 1,
									month,
								).date.valueOf() === selected.valueOf()
									? "selected-day"
									: ""
							}`}
							on:click={() =>
								on_select(
									to_time(day_in_month(i * 7 + j + 1, month).date),
								)}
						>
							{day_in_month(i * 7 + j + 1, month).day}
						</button>
					</td>
				{/each}
			</tr>
		{/each}
	</table>
</div>

<svelte:window on:keydown|preventDefault={keypress} />

<style>
	.day-button {
		width: 100%;
		border-radius: 0px;
	}

	table {
		border-collapse: collapse;
		table-layout: fixed;
	}

	td,
	th {
		/* border: 1px solid var(--text-normal); */
		margin: 0px;
		padding: 1px;
		width: 30px;
		height: 30px;
		overflow: hidden;
	}

	.other-month {
		opacity: 0.5;
	}

	.today {
		color: var(--text-accent);
	}

	.date-name {
		display: inline-block;
		min-width: 148px;
		text-align: center;
	}

	.calendar-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.calendar {
		width: 100%;
		align-items: center;
		display: grid;
	}

	.selected-day {
		background-color: var(--interactive-accent);
	}
</style>
