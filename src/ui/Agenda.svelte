<script lang="ts">
	import DailyWeeklyView from "./DailyWeeklyView.svelte";
	import { TodoItem, AgendaView, AgendaViewType } from "../types";
	import GlobalTodoView from "./GlobalTodoView.svelte";
	import CalendarView from "./CalendarView.svelte";

	export let todos: TodoItem[];
	export let view: AgendaView;

	let view_options = [
		{ id: AgendaViewType.DailyWeekly, text: `Daily/Weekly View` },
		{ id: AgendaViewType.GlobalTODO, text: `Global TODO View` },
		{ id: AgendaViewType.Calendar, text: `Calendar View` },
	];

	let selected: { id: AgendaViewType; text: string } =
		view_options.find((option) => option.id === view.type) ||
		view_options[0];

	const on_change = () => {
		switch (selected.id) {
			case AgendaViewType.DailyWeekly:
				view = {
					type: AgendaViewType.DailyWeekly,
					date: new Date(Date.now()),
					days_after_showing: 6,
					days_before_showing: 0,
				};
				break;
			case AgendaViewType.GlobalTODO:
				view = {
					type: AgendaViewType.GlobalTODO,
				};
				break;
			case AgendaViewType.Calendar:
				view = {
					type: AgendaViewType.Calendar,
					month: new Date(Date.now()),
				};
				break;
		}
	};


</script>

<select bind:value={selected} on:change={on_change}>
	{#each view_options as question}
		<option value={question}>
			{question.text}
		</option>
	{/each}
</select>

{#if view.type === AgendaViewType.DailyWeekly}
	<DailyWeeklyView {todos} {view} />
{:else if view.type === AgendaViewType.GlobalTODO}
	<GlobalTodoView {todos} />
{:else if view.type === AgendaViewType.Calendar}
	<CalendarView {todos} {view} />
{/if}

<style>
	select {
		margin: 10px;
	}
</style>
