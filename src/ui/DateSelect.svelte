<script lang="ts">
	import { time_now } from "../utils";
	import { day_in_month, keypress, to_time } from "../calendar";
	import { Time } from "../types";
	import { writable, derived } from "svelte/store";

	export let on_select: (t: Time) => void;
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

	let selected_init = inital_date.date;
	selected_init.setHours(0, 0, 0, 0);

	let month = new Date(selected_init);

	const selected = writable(selected_init);

	selected.subscribe((value) => {
		month = new Date(value);
		month.setHours(0, 0, 0, 0);
		month.setDate(1);
	});

	const keypress_handler = keypress(selected, on_select);

	let selected_time = 0;

	selected.subscribe((value) => {
		const date = new Date(value);
		date.setHours(0, 0, 0, 0);
		selected_time = date.valueOf();
	});
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
		{#each Array(6) as _, r}
			<tr>
				{#each Array(7) as _, c}
					<td>
						<button
							class={`day-button ${
								day_in_month(r, c, month).in_month
									? ""
									: "other-month"
							} ${
								day_in_month(r, c, month).is_today
									? "today"
									: ""
							} ${
								day_in_month(r, c, month).date.valueOf() ===
								selected_time
									? "selected-day"
									: ""
							}`}
							on:click={() =>
								on_select(
									to_time(day_in_month(r, c, month).date),
								)}
						>
							{day_in_month(r, c, month).day}
						</button>
					</td>
				{/each}
			</tr>
		{/each}
	</table>
</div>

<svelte:window on:keydown|preventDefault={keypress_handler} />

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
