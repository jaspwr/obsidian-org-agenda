<script lang="ts">
	import AgendaItem from "AgendaItem.svelte";
	import { TodoItem, AgendaView, AgendaViewType } from "./types";
	import { priority_cmp } from "./utils";

	export let todos: TodoItem[];

	let filters_options_expanded = false;

	let show_done = true;
	let name_filter = "";

	$: filters = (todo: TodoItem) => {
		if (!show_done && todo.flag === "DONE") return false;
		if (
			name_filter !== undefined &&
			!todo.name.toLowerCase().includes(name_filter.toLowerCase())
		)
			return false;
		return true;
	};

	$: todo_list = todos.filter(filters).sort((a, b) => {
		let a_prio = 0;
		let b_prio = 0;

		if (a.flag === "DONE") a_prio -= 10;
		if (b.flag === "DONE") b_prio -= 10;

		return -a_prio + b_prio + priority_cmp(b.priority, a.priority);
	});
</script>

<h3>
	Filters

	<button
		on:click={() => (filters_options_expanded = !filters_options_expanded)}
	>
		{filters_options_expanded ? "Hide" : "Show"}
	</button>
</h3>
{#if filters_options_expanded}
	<div class="filter-options">
		<div class="option">
			<input type="checkbox" bind:checked={show_done} />
			<label for="show_done">Show completed</label>
		</div>
		<div class="option">
			<input type="text" bind:value={name_filter} />
			<label for="name_filter">Name filter</label>
		</div>
	</div>
{/if}

{#each todo_list as todo}
	<table>
		<AgendaItem {todo} />
	</table>
{/each}

<style>
	.filter-options {
		margin: 10px;
	}

	.option {
		margin: 5px;
	}

	.option label {
		display: inline-block;
		padding-right: 10px;
		white-space: nowrap;
	}
	.option input {
		vertical-align: middle;
	}

</style>
