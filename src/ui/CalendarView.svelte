<script>
	import { flag_colour, occurs_on_day } from "../utils";
	import { day_in_month, keypress } from "../calendar";
	import { writable } from "svelte/store";

	export let todos;
	export let view;

	const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	let selected_init = view.month;
	selected_init.setHours(0, 0, 0, 0);

	let month = new Date(selected_init);

	const selected = writable(selected_init);

	selected.subscribe((value) => {
		month = new Date(value);
		month.setHours(0, 0, 0, 0);
		month.setDate(1);
	});

	const keypress_handler = keypress(selected, () => {});

	let selected_time = 0;

	selected.subscribe((value) => {
		const date = new Date(value);
		date.setHours(0, 0, 0, 0);
		selected_time = date.valueOf();
	});

	const occurs_on_calendar_day = (todos, row, col, month) => {
		const day = day_in_month(row, col, month).date;
		day.setHours(0, 0, 0, 0);
		return todos.filter((t) => occurs_on_day(t, day.valueOf()));
	};
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
				<th class="day-of-week">{day}</th>
			{/each}
		</tr>
		{#each Array(6) as _, r}
			<tr>
				{#each Array(7) as _, c}
					<td
						class={`${
							day_in_month(r, c, month).in_month
								? ""
								: "td-not-in-month"
						}
						} ${
							day_in_month(r, c, month).date.valueOf() ===
							selected_time
								? "selected-day"
								: ""
						}`}
					>
						<div
							class={`day-button ${
								day_in_month(r, c, month).in_month
									? ""
									: "other-month"
							} ${
								day_in_month(r, c, month).is_today
									? "today"
									: ""
							}`}
						>
							{day_in_month(r, c, month).day}
							<div>
								{#each occurs_on_calendar_day(todos, r, c, month) as todo}
									<div
										class={`todo-item ${
											todo.flag === "DONE"
												? "agenda-task-done"
												: ""
										}`}
									>
										<span
											style={`color: ${flag_colour(
												todo.flag,
											)}`}
										>
											{todo.flag.slice(0, 1)}
										</span>
										{todo.name}
									</div>
								{/each}
							</div>
						</div>
					</td>
				{/each}
			</tr>
		{/each}
	</table>
</div>

<!-- <svelte:window on:keydown|preventDefault={keypress_handler} /> -->

<style>
	.day-button {
		width: 100%;
		border-radius: 0px;
	}

	table {
		margin: 5px;
		margin-top: 10px;
		border-collapse: collapse;
		table-layout: fixed;
	}

	td,
	th {
		border: 1px solid var(--pre-code);
		margin: 0px;
		padding: 1px;
		width: calc(100% / 7);
		height: 6rem;
		overflow: hidden;
		display: inline-block;
		overflow-y: scroll;
	}

	.day-of-week {
		border: none;
		height: 1.3rem;
		overflow-y: hidden;
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

	.td-not-in-month {
		background-color: var(--pre-code);
	}

	.todo-item {
		font-size: 0.8em;
		margin-left: 5px;
		background-color: var(--pre-code);
		padding: 2px;
		border-radius: 4px;
		margin-bottom: 2px;
	}
</style>
