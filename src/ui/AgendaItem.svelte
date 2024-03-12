<script lang="ts">
	import { TodoItem } from "../types";
	import { flag_colour, format_time, relative_days } from "../utils";

	export let todo: TodoItem;
	export let shows_time: boolean;
	export let show_relative_days: boolean;
	export let day_displaying_on: Date;
</script>

<tr class="todo-item">
	<td class="agenda-row-file">
		{#if todo.location.file}
			{todo.location.file}:
		{/if}
	</td>
	<td class="agenda-row-time row-item-time">
		{#if shows_time && todo.date?.has_time_of_day}
			{format_time(todo.date?.date) + "••••••"}
		{:else if show_relative_days}
			{relative_days(day_displaying_on, new Date(Date.now()))}
		{:else}
			&nbsp;
		{/if}
	</td>
	<td class={`agenda-row-content ${todo.flag === "DONE" ? "agenda-task-done" : ""}`}>
		<span style={`color: ${flag_colour(todo.flag)};`} class="flag"
			>{todo.flag}</span
		>
		{#if todo.priority}
			<span class="priority">[{todo.priority}]</span>
		{/if}

		{todo.name}
	</td>
</tr>

<style>
	.row-item-time {
		color: var(--text-accent);
	}

	.flag {
		background-color: var(--pre-code);
		padding: 3px;
		border-radius: 4px;
	}

	.priority {
		font-weight: bold;
		color: var(--text-accent);
	}
</style>
