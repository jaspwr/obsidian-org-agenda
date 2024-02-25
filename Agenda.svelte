<script lang="ts">
	import { TodoItem } from "./types";
	import { flag_colour } from "./flag_colour";

	export let todos: TodoItem[];

	const day_range_start = new Date(Date.now());
	day_range_start.setHours(0, 0, 0, 0);

	const DAY_IN_MS = 1000 * 60 * 60 * 24;

	const occurs_on_day = (todo: TodoItem, day: number) => {
		if (!todo.date) return false;
		const todo_day = new Date(todo.date.date);
		todo_day.setHours(0, 0, 0, 0);
		return todo_day.valueOf() === day;
	};

	const day_range = [...Array(20).keys()].map((i) => {
		const day = day_range_start.valueOf() + i * DAY_IN_MS;
		const todos_on_day = todos
			.filter((todo) => occurs_on_day(todo, day))
			.sort(
				(a, b) =>
					(a.date?.date.valueOf() || 0) -
					(b.date?.date.valueOf() || 0),
			);

		return { day, todos_on_day };
	});
</script>

{#each day_range as { day, todos_on_day }}
	<div>
		<div class="date-name">
			{new Date(day).toDateString()}
		</div>
		<ul>
			{#each todos_on_day as todo}
				<li
					class={`todo-item ${
						todo.flag === "DONE" ? "task-done" : ""
					}`}
				>
					<span
						style={`color: ${flag_colour(todo.flag)};`}
						class="flag">{todo.flag}</span
					>
					{todo.name}
				</li>
			{/each}
		</ul>
	</div>
{/each}

<style>
	.date-name {
		font-size: 1.2em;
		font-weight: bold;
		color: var(--interactive-accent);
	}

	ul {
		margin-top: 0;
		margin-bottom: 0;
	}

	.task-done {
		text-decoration: line-through;
		opacity: 0.5;
	}

	.flag {
		background-color: var(--pre-code);
		padding: 3px;
		border-radius: 4px;
	}
</style>
