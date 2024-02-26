<script lang="ts">
	import DailyWeeklyView from "DailyWeeklyView.svelte";
	import { TodoItem, AgendaView, AgendaViewType } from "./types";
	import GlobalTodoView from "GlobalTodoView.svelte";

	export let todos: TodoItem[];
	export let view: AgendaView;
</script>

{#if view.type === AgendaViewType.DailyWeekly}
	<DailyWeeklyView {todos} {view} />
{:else}
	<GlobalTodoView {todos} />
{/if}
