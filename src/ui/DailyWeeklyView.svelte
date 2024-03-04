<script lang="ts">
	import AgendaItem from "./AgendaItem.svelte";
	import { TodoItem, DailyWeeklyView } from "../types";
	import { format_time, occurs_on_day } from "../utils";

	export let todos: TodoItem[];
	export let view: DailyWeeklyView;

	let origin = view.date;
	origin.setHours(0, 0, 0, 0);

	const DAY_IN_MS = 1000 * 60 * 60 * 24;

	let days_after_showing = view.days_after_showing;
	let days_before_showing = view.days_before_showing;

	$: days_range = days_after_showing + days_before_showing + 1;

	$: day_range_start = new Date(
		new Date(origin).valueOf() - days_before_showing * DAY_IN_MS,
	);

	type Day = {
		day: number;
		no_time_items: TodoItem[];
		time_items: TodoItem[];
		full_time_view: boolean;
	};

	const today = new Date(Date.now());
	today.setHours(0, 0, 0, 0);

	$: day_range = [...Array(days_range).keys()].map((i) => {
		day_range_start.setHours(0, 0, 0, 0);
		const day = day_range_start.valueOf() + i * DAY_IN_MS;

		const origin_ = new Date(origin);
		origin_.setHours(0, 0, 0, 0);
		const full_time_view = day === origin_.valueOf();

		const items_on_day = todos.filter((todo) => occurs_on_day(todo, day));

		const no_time_items = items_on_day.filter(
			(todo) => !todo.date?.has_time_of_day,
		);

		const time_items = items_on_day
			.filter((todo) => todo.date?.has_time_of_day)
			.sort(
				(a, b) =>
					(a.date?.date.valueOf() || 0) -
					(b.date?.date.valueOf() || 0),
			);

		return { day, no_time_items, time_items, full_time_view };
	});

	const time_range = (start: Date, end: Date, division: Date): Date[] => {
		let divisions = [];

		while (start < end) {
			divisions.push(start);
			start = new Date(start.valueOf() + division.valueOf());
		}

		return divisions;
	};

	const TWO_HOURS = new Date(1000 * 60 * 60 * 2);

	type TimeSlot = {
		start: Date;
		todos: (TodoItem | "now")[];
	};

	const now = new Date(Date.now());

	const full_list = (day: number, todos: TodoItem[]): TimeSlot[] => {
		const division = TWO_HOURS;

		const start = new Date(day);
		start.setHours(8, 0, 0, 0);
		const end = new Date(day);
		end.setHours(22, 0, 0, 0);

		let ret = time_range(start, end, division).map((start) => {
			const end = start.valueOf() + division.valueOf();
			let todos_in_slot: (TodoItem | "now")[] = todos.filter((todo) => {
				let t = todo.date?.date.valueOf();
				if (t === undefined) return false;
				return t >= start.valueOf() && t < end;
			});
			return { start, todos: todos_in_slot };
		});

		let last = new Date(start);
		while (last < end) {
			last = new Date(last.valueOf() + division.valueOf());
		}

		const after = todos.filter(
			(todo) =>
				(todo.date ?? { date: new Date(0) }).date.valueOf() >=
				last.valueOf(),
		);

		ret[ret.length - 1].todos = ret[ret.length - 1].todos.concat(after);

		const now = new Date(Date.now());

		for (let i = 0; i < ret.length; i++) {
			let start = ret[i].start;
			let end = start.valueOf() + division.valueOf();
			let todos_in_slot = ret[i].todos;

			if (now.valueOf() >= start.valueOf() && now.valueOf() < end) {
				if (ret[i].todos.length === 0) {
					ret[i].todos = ["now"];
					break;
				}

				let date = 0;
				let todo = todos_in_slot[0];
				if (todo !== "now") {
					date = todo.date?.date.valueOf() || 0;
				}

				if (now.valueOf() < date) {
					ret[i].todos = ["now", ...todos_in_slot];
					break;
				}

				let found = false;

				for (let j = 0; j < todos_in_slot.length; j++) {
					let date = 0;
					let todo = todos_in_slot[j];
					if (todo !== "now") {
						date = todo.date?.date.valueOf() || 0;
					}

					if (now.valueOf() > date) {
						ret[i].todos = [
							...todos_in_slot.slice(0, j + 1),
							"now",
							...todos_in_slot.slice(j + 1),
						];
						found = true;
						break;
					}
				}

				if (!found) {
					ret[i].todos.push("now");
				}
			}
		}

		return ret;
	};

	const before_day = (day: number, todos: TodoItem[]): TodoItem[] => {
		const start = new Date(day);
		start.setHours(8, 0, 0, 0);

		const before = todos.filter(
			(todo) =>
				(todo.date || { date: new Date(0) }).date.valueOf() <
				start.valueOf(),
		);

		return before;
	};
</script>

<div class="options">
	Previous days:
	<input class="day-select" type="number" bind:value={days_before_showing} />
	Day
	<input type="date" bind:value={origin} />
	Following days:
	<input class="day-select" type="number" bind:value={days_after_showing} />
</div>

{#each day_range as { day, no_time_items, time_items, full_time_view }}
	<div>
		<div class="date-name">
			{new Date(day).toDateString()}
		</div>
		<table class="list">
			{#if full_time_view}
				{#each before_day(day, time_items) as todo}
					<AgendaItem {todo} shows_time={true} />
				{/each}
				{#each full_list(day, time_items) as { start, todos }}
					<tr style="opacity: 0.6">
						<td class="agenda-row-file"></td>
						<td class="agenda-row-time"
							>{format_time(start) + "••••••"}</td
						>
						<td class="agenda-row-content">{"-".repeat(15)}</td>
					</tr>

					{#each todos as todo}
						{#if todo === "now"}
							<tr>
								<td class="agenda-row-file"></td>
								<td class="agenda-row-time"
									>{format_time(new Date(Date.now())) +
										"••••••"}</td
								>
								<td class="agenda-row-content"
									>{"[NOW]" + " -".repeat(7)}</td
								>
							</tr>
						{:else}
							<AgendaItem {todo} shows_time={true} />
						{/if}
					{/each}
				{/each}
			{:else}
				{#each time_items as todo}
					<AgendaItem {todo} shows_time={true} />
				{/each}
			{/if}

			{#each no_time_items as todo}
				<AgendaItem {todo} shows_time={false} />
			{/each}
		</table>
	</div>
{/each}

<style>
	.date-name {
		font-size: 1.2em;
		font-weight: bold;
		color: var(--interactive-accent);
	}

	.list {
		margin-top: 0;
		margin-bottom: 0;
		margin-left: 0.5rem;
	}

	table {
		border-collapse: collapse;
		table-layout: fixed;
	}

	td {
		/* border: 1px solid var(--text-normal); */
		margin: 0px;
		padding: 0.5px;
		width: 30px;
		height: 30px;
		overflow: hidden;
	}

	.options {
		margin: 10px;
	}

	.day-select {
		width: 3rem;
	}
</style>
