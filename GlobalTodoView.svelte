<script lang="ts">
	import AgendaItem from "AgendaItem.svelte";
	import { TodoItem, AgendaView, AgendaViewType } from "./types";
	import { priority_cmp } from "./utils";

	export let todos: TodoItem[];

	todos.sort((a, b) => {
		let a_prio = 0;
		let b_prio = 0;

		if (a.flag === "DONE") a_prio -= 10;
		if (b.flag === "DONE") b_prio -= 10;

		return -a_prio + b_prio + priority_cmp(b.priority, a.priority);
	});
</script>

{#each todos as todo}
	<table>
		<AgendaItem {todo} />
	</table>
{/each}
