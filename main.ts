import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';


import { AgendaViewType, Time, TodoItem } from './types';

interface OrgAgendaSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: OrgAgendaSettings = {
	mySetting: 'default'
}

enum TokenType {
	Word,
	Date,
	Priority,
	Flag,
}

type Token = {
	value: string;
	type: TokenType;
	range: {
		start: number;
		end: number;
	};
}

/** 
* Splits by whitespace but groups anything in square or angel brackets.
* Useful for parsing TODO items.
*/
function tokenize_todo_item(line: string): Token[] {
	const tokens: Token[] = [];

	let current_token: string = "";

	let i = 0;
	const push_token = (type: TokenType) => {
		if (current_token.length === 0) return;

		tokens.push({
			value: current_token,
			type,
			range: {
				start: i - current_token.length + 1,
				end: i + 1,
			}
		});

		current_token = "";
	};

	enum State {
		Normal,
		SquareBrackets,
		AngelBrackets,
	}

	let state = State.Normal;

	for (i = 0; i < line.length; i++) {
		const c = line[i];

		if (state === State.Normal) {
			if (c === " " || c === "\t" || c === "\r" || c === "\n") {
				push_token(TokenType.Word);
				continue;
			}

			if (c === "[") {
				state = State.SquareBrackets;
				push_token(TokenType.Word);
			}

			if (c === "<") {
				state = State.AngelBrackets;
				push_token(TokenType.Word);
			}

			current_token += c;
		} else if (state === State.SquareBrackets) {
			current_token += c;

			let type = TokenType.Priority;
			if (parse_date(current_token) !== null) {
				type = TokenType.Date;
			}

			if (c === "]") {
				state = State.Normal;
				push_token(type);
			}
		} else if (state === State.AngelBrackets) {
			current_token += c;

			if (c === ">") {
				state = State.Normal;
				push_token(TokenType.Date);
			}
		}
	}

	return tokens;
}

/**
* Strips square and angel brackets.
*/
function strip_brackets(s: string): string {
	if (s.startsWith("<") && s.endsWith(">")) {
		return s.slice(1, -1);
	}

	if (s.startsWith("[") && s.endsWith("]")) {
		return s.slice(1, -1);
	}

	return s;
}

/**
* Parses date in org-agenda format (e.g. <1970-01-01 Sun 00:00>).
* The time of day and day of week are optional.
*/
function parse_date(date: string): { date: Date; has_time_of_day: boolean } | null {
	let tokens = strip_brackets(date).split(" ").filter((t) => t.length > 0);

	if (tokens.length === 0) return null;

	let day = tokens[0].split("-");
	if (day.length !== 3) return null;

	let year = parseInt(day[0]);
	let month = parseInt(day[1]);
	let day_of_month = parseInt(day[2]);

	// No time of day. Day of week ignored.
	if (tokens.length === 1 || tokens.length === 2) {
		const date = new Date(year, month - 1, day_of_month);
		return { date, has_time_of_day: false };
	}


	if (tokens.length === 3) {
		let time = tokens[2].split(":");
		if (time.length !== 2) return null;

		let hour = parseInt(time[0]);
		let minute = parseInt(time[1]);

		const date = new Date(year, month - 1, day_of_month, hour, minute);
		return { date, has_time_of_day: true };
	}

	return null;
}

/**
* Formats date in org-agenda format (e.g. <1970-01-01 Sun>).
*/
function format_date(time: Time): string {
	let date = time.date;
	const year = date.getFullYear().toString();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");

	const date_str = `${year}-${month}-${day}`;

	const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	const day_of_week = DAYS[date.getDay()];

	const hour = date.getHours().toString().padStart(2, "0");
	const minute = date.getMinutes().toString().padStart(2, "0");

	// TODO: time ranges
	if (time.has_time_of_day) {
		return `<${date_str} ${day_of_week} ${hour}:${minute}>`;
	} else {
		return `<${date_str} ${day_of_week}>`;
	}
}

function token_under_cursor(editor: Editor): Token | null {
	let cursor = editor.getCursor();
	let line = editor.getLine(cursor.line);

	let tokens = tokenize_todo_item(line);

	for (let token of tokens) {
		if (cursor.ch >= token.range.start && cursor.ch < token.range.end - 1) {
			return token;
		}
	}

	return null;
}

export default class OrgAgenda extends Plugin {
	settings: OrgAgendaSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			AGENDA_VIEW_TYPE,
			(leaf) => new AgendaView(leaf, this.app)
		);

		const open_agenda = async () => {
			const leaves = this.app.workspace
				.getLeavesOfType(AGENDA_VIEW_TYPE);

			if (leaves.length > 0) {
				this.app.workspace.revealLeaf(leaves[0]);
				this.app.workspace.setActiveLeaf(leaves[0]);
			} else {
				const leaf = this.app.workspace.getLeaf("tab");
				await leaf.setViewState({
					type: AGENDA_VIEW_TYPE,
					active: true,
				});
				this.app.workspace.revealLeaf(leaf);
				this.app.workspace.setActiveLeaf(leaf);
			}
		}

		const ribbonIconEl = this.addRibbonIcon('calendar-clock', 'Sample Plugin', async (evt: MouseEvent) => {
			await open_agenda();
		});

		ribbonIconEl.addClass('my-plugin-ribbon-class');

		const set_date = (editor: Editor) => (date: Time) => {
			let cursor = editor.getCursor();
			let line = editor.getLine(cursor.line);

			let tokens = tokenize_todo_item(line);
			if (tokens.length < 2 || tokens[0].value != "*") return;

			const formatted_date = format_date(date);

			let date_token = tokens.find((t) => t.type === TokenType.Date);

			if (date_token !== undefined) {
				// There is already a date, we need to replace it.

				cursor.ch = date_token.range.start;
				editor.replaceRange(
					formatted_date,
					cursor,
					{ line: cursor.line, ch: cursor.ch + date_token.value.length }
				);
			} else {
				// There is no date, we need to add one and a space if the line doesn't 
				// already end with one.

				cursor.ch = line.length;

				if (line[cursor.ch] !== " ") {
					editor.replaceRange(" ", cursor, cursor);
					cursor.ch++;
				}

				editor.replaceRange(
					formatted_date,
					cursor
				);
			}

			editor.setSelection({
				line: cursor.line,
				ch: cursor.ch + formatted_date.length,
			});
		};

		const get_date_from_cursor = (editor: Editor) => {
			const cursor = editor.getCursor();
			const line = editor.getLine(cursor.line);

			let tokens = tokenize_todo_item(line);
			if (tokens.length < 2 || tokens[0].value != "*") return null;

			let date_token = tokens.find((t) => t.type === TokenType.Date);

			if (date_token === undefined) return null;

			return parse_date(date_token.value);
		}

		const offset_date = (token: Token, line: number, editor: Editor, offset_ms: number) => {
			if (token.type !== TokenType.Date) throw new Error("Token is not a date");

			let date = parse_date(token.value);
			if (date === null) return;

			date.date = new Date(date.date.valueOf() + offset_ms);
			let formatted_date = format_date(date);

			editor.replaceRange(
				formatted_date,
				{ line, ch: token.range.start },
				{ line, ch: token.range.end }
			);
		};

		const is_digit = (char: string): boolean => {
			return "0123456789".includes(char);
		};

		const offset_date_item_under_cursor = (editor: Editor, offset: number) => {
			// Just increments whatever number is under the cursor.

			const cursor = editor.getCursor();
			const line = editor.getLine(cursor.line);

			let start = cursor.ch;
			let end = cursor.ch;

			// TODO: Day of week.

			while (start > 0 && is_digit(line[start - 1])) start--;
			while (end < line.length && is_digit(line[end])) end++;

			let number = parseInt(line.slice(start, end));

			if (isNaN(number)) return;

			number += offset;

			editor.replaceRange(
				number.toString(),
				{ line: cursor.line, ch: start },
				{ line: cursor.line, ch: end }
			);

			// Uses the builtin date do handle rolling over months and years ect.
			// Simplest way to cover all edge cases.

			let token = token_under_cursor(editor);

			if (token === null || token.type !== TokenType.Date) return;

			let date = parse_date(token.value);

			if (date === null) return;

			let formatted_date = format_date(date);

			if (formatted_date !== token.value) {
				editor.replaceRange(
					formatted_date,
					{ line: cursor.line, ch: token.range.start },
					{ line: cursor.line, ch: token.range.end }
				);
			}

			const new_line = editor.getLine(cursor.line);

			if (cursor.ch < new_line.length) {
				editor.setCursor(cursor);
			}
		};

		const cycle_todo_state = (editor: Editor, backwards: boolean, line_number: number) => {

			let line = editor.getLine(line_number);

			let tokens = tokenize_todo_item(line);
			if (tokens.length < 2 || tokens[0].value != "*") return;

			const flag = tokens[1].value;

			if (backwards) {
				if (flag === "TODO") {
					let pos = line.indexOf("TODO");
					let whitespace = 0;
					let pos_end = pos + 4;
					while (pos_end + whitespace < line.length && line[pos_end + whitespace] === " ") whitespace++;

					editor.replaceRange("", { line: line_number, ch: pos }, { line: line_number, ch: pos_end + whitespace });
				} else if (flag === "DONE") {
					let pos = line.indexOf("DONE");
					editor.replaceRange("TODO", { line: line_number, ch: pos }, { line: line_number, ch: pos + 4 });
				} else {
					let pos = line.indexOf("*");
					editor.replaceRange("* DONE", { line: line_number, ch: pos }, { line: line_number, ch: pos + 1 });
				}
			} else {
				if (flag === "TODO") {
					let pos = line.indexOf("TODO");
					editor.replaceRange("DONE", { line: line_number, ch: pos }, { line: line_number, ch: pos + 4 });
				} else if (flag === "DONE") {
					let pos = line.indexOf("DONE");
					let whitespace = 0;
					let pos_end = pos + 4;
					while (pos_end + whitespace < line.length && line[pos_end + whitespace] === " ") whitespace++;

					editor.replaceRange("", { line: line_number, ch: pos }, { line: line_number, ch: pos_end + whitespace });
				} else {
					let pos = line.indexOf("*");
					editor.replaceRange("* TODO", { line: line_number, ch: pos }, { line: line_number, ch: pos + 1 });
				}
			}
		}

		const cycle_selected_todo_state = (backwards: boolean) => (editor: Editor) => {
			// TODO: Get all selected lines
			let selected_lines = [];

			if (selected_lines.length === 0) {
				let cursor = editor.getCursor();
				selected_lines.push(cursor.line);
			}

			for (let line_number of selected_lines) {
				cycle_todo_state(editor, backwards, line_number);
			}
		};

		this.addCommand({
			id: "cycle-todo-state",
			name: "Cycle TODO state",
			editorCallback: cycle_selected_todo_state(false),
		});

		this.addCommand({
			id: "cycle-todo-state-backwards",
			name: "Cycle TODO state backwards",
			editorCallback: cycle_selected_todo_state(true),
		});

		const DAY_MS = 1000 * 60 * 60 * 24;

		const shift_left_right = (editor: Editor, backwards: boolean) => {
			const token = token_under_cursor(editor);
			if (token !== null && token.type === TokenType.Date) {
				let cursor = editor.getCursor();
				offset_date(token, cursor.line, editor, backwards ? -DAY_MS : DAY_MS);

				const line = editor.getLine(cursor.line);
				if (cursor.ch < line.length) {
					editor.setCursor(cursor);
				}
			} else {
				cycle_selected_todo_state(backwards)(editor);
			}
		};

		this.addCommand({
			id: "shift-left",
			name: "Shift left",
			editorCallback: (editor: Editor) => {
				shift_left_right(editor, true);
			},
			hotkeys: [
				{
					modifiers: ["Shift"],
					key: "ArrowLeft",
				}
			]
		});

		this.addCommand({
			id: "shift-right",
			name: "Shift Right",
			editorCallback: (editor: Editor) => {
				shift_left_right(editor, false);
			},
			hotkeys: [
				{
					modifiers: ["Shift"],
					key: "ArrowRight",
				}
			]
		});

		const cycle_priority = (editor: Editor, backwards: boolean) => {
			let cursor = editor.getCursor();
			let line = editor.getLine(cursor.line);
			const tokens = tokenize_todo_item(line);

			for (let token of tokens) {
				if (token.type !== TokenType.Priority) continue;

				let priority = strip_brackets(token.value);

				let new_priority = undefined;

				switch (priority) {
					case "#A":
						new_priority = backwards ? "" : "#B";
						break;
					case "#B":
						new_priority = backwards ? "#A" : "#C";
						break;
					case "#C":
						new_priority = backwards ? "#B" : "";
						break;
					default:
						new_priority = backwards ? "#C" : "#A";
						break;
				}

				if (new_priority === "") {
					let start = token.range.start;
					let end = token.range.end;

					while (start > 1 && line[start - 1] === " ") start--;
					while (end < line.length - 1 && line[end] === " ") end++;

					editor.replaceRange(
						" ",
						{ line: cursor.line, ch: start },
						{ line: cursor.line, ch: end }
					);
				} else {
					editor.replaceRange(
						`[${new_priority}]`,
						{ line: cursor.line, ch: token.range.start },
						{ line: cursor.line, ch: token.range.end }
					);
				}


				return;
			}

			// No priority found, add one.

			const new_priority = backwards ? " [#C]" : " [#A]";
			if (tokens.length < 2 || tokens[0].value != "*") return;
			if (!org_flags.includes(tokens[1].value)) return;
			editor.replaceRange(
				new_priority,
				{ line: cursor.line, ch: tokens[1].range.end - 1 },
				{ line: cursor.line, ch: tokens[1].range.end - 1 }
			);
		};

		this.addCommand({
			id: "shift-up",
			name: "Shift Up",
			editorCallback: (editor: Editor) => {
				if (token_under_cursor(editor)?.type === TokenType.Date) {
					offset_date_item_under_cursor(editor, 1);
				} else {
					cycle_priority(editor, false);
				}
			},
			hotkeys: [
				{
					modifiers: ["Shift"],
					key: "ArrowUp",
				}
			]
		});

		this.addCommand({
			id: "shift-down",
			name: "Shift Down",
			editorCallback: (editor: Editor) => {
				if (token_under_cursor(editor)?.type === TokenType.Date) {
					offset_date_item_under_cursor(editor, -1);
				} else {
					cycle_priority(editor, true);
				}
			},
			hotkeys: [
				{
					modifiers: ["Shift"],
					key: "ArrowDown",
				}
			]
		});

		this.addCommand({
			id: "insert-date",
			name: "Insert date",
			editorCallback: (editor: Editor) => {
				new DateSelectModal(this.app, set_date(editor), get_date_from_cursor(editor) || undefined).open();
			}
		});

		this.addCommand({
			id: "open-agenda",
			name: "Open agenda",
			callback: open_agenda,
		});

		this.registerEditorExtension(editorPlugin)


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

const ORG_DEAFULT_FLAGS = ["TODO", "DONE", "WAITING", "CANCELLED", "SCHEDULED", "DEADLINE", "CLOSED", "BLOCKED", "POSTPONED"];

const org_flags = ORG_DEAFULT_FLAGS;

async function get_todos(app: App): Promise<TodoItem[]> {
	const files = this.app.vault.getMarkdownFiles();

	const todos: TodoItem[] = [];

	for (let i = 0; i < files.length; i++) {
		const contents = await app.vault.cachedRead(files[i]);
		contents.split('\n').forEach((line: string, line_number: number) => {
			const tokens = tokenize_todo_item(line);

			if (tokens.length < 2
				|| tokens[0].value !== "*"
				|| !org_flags.includes(tokens[1].value)) return;

			const location = {
				file: files[i].path,
				line: line_number + 1,
			};

			const name = tokens
				.slice(2)
				.filter((t) => t.type === TokenType.Word)
				.map((t) => t.value)
				.join(" ");

			let date: { date: Date; has_time_of_day: boolean } | undefined = undefined;
			let priority: string | undefined = undefined;

			for (let i = 2; i < tokens.length; i++) {
				if (tokens[i].type === TokenType.Date) {
					date = parse_date(tokens[i].value) || undefined;
				} else if (tokens[i].type === TokenType.Priority) {
					let priority_str = strip_brackets(tokens[i].value);
					if (priority_str === undefined) continue;
					priority = priority_str;
				}
			}

			const flag = tokens[1].value;

			const todo: TodoItem = {
				flag,
				name,
				location,
				date,
				priority,
			};

			todos.push(todo);
		});
	}

	return todos;
}

import { ItemView, WorkspaceLeaf } from "obsidian";

//@ts-ignore
import Agenda from "./Agenda.svelte";

export const AGENDA_VIEW_TYPE = "org-agenda-view";

export class AgendaView extends ItemView {
	component: Agenda;

	constructor(leaf: WorkspaceLeaf, app: App) {
		super(leaf);
		this.app = app;
	}

	getViewType() {
		return AGENDA_VIEW_TYPE;
	}

	getDisplayText() {
		return "Agenda";
	}

	getIcon(): string {
		return "calendar-clock";
	}

	async onOpen() {
		let todos = await get_todos(this.app);

		this.component = new Agenda({
			target: this.contentEl,
			props: {
				todos: todos,
				view: {
					type: AgendaViewType.DailyWeekly,
					date: new Date(Date.now()),
					days_before_showing: 0,
					days_after_showing: 6,
				},
				// view: {
				// 	type: AgendaViewType.GlobalTODO,
				// },
			}
		});
	}

	async onClose() {
		this.component.$destroy();
	}
}

//@ts-ignore
import Calendar from './Calendar.svelte';

class DateSelectModal extends Modal {
	on_select: (date: Time) => void;
	component?: Calendar;
	inital_date?: Time;

	constructor(app: App, on_select: (date: Time) => void, inital_date?: Time) {
		super(app);
		this.on_select = on_select;
		this.inital_date = inital_date;
	}

	onOpen() {
		let on_select = (date: Time) => {
			this.on_select(date);
			this.close();
		};

		const { contentEl } = this;
		this.component = new Calendar({
			target: contentEl,
			props: {
				on_select,
				inital_date: this.inital_date,
			}
		});
	}

	onClose() {
		if (this.component) {
			this.component.$destroy();
		}
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: OrgAgenda;

	constructor(app: App, plugin: OrgAgenda) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language"
import { RangeSetBuilder } from "@codemirror/state";
import { flag_colour } from 'utils';

export class FlagWidget extends WidgetType {
	flag: string;
	line: number;

	constructor(flag: string, line: number) {
		super();
		this.flag = flag;
		this.line = line;
	}

	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("span");

		div.innerText = this.flag;

		div.style.color = flag_colour(this.flag);

		div.style.backgroundColor = "var(--pre-code)";
		div.style.padding = "3px";
		div.style.borderRadius = "4px";
		div.style.cursor = "pointer";


		div.onclick = () => {
			console.log(this.line);
		};

		return div;
	}
}

export class DateWidget extends WidgetType {
	date_text: string;
	date?: Date;

	constructor(date_text: string, date?: Date) {
		super();
		this.date_text = date_text;

		if (date === undefined) {
			this.date = parse_date(date_text)?.date || undefined;
		}
	}

	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("span");

		div.innerText = this.date_text;

		div.classList.add("cm-hmd-internal-link");
		div.classList.add("cm-underline");
		div.classList.add("agenda-clickable");

		div.onclick = () => {
			console.log(this.date);
		};

		return div;
	}
}

class EditorPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged || update.selectionSet) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() { }

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();

		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					if (!node.type.name.startsWith("list")) {
						return;
					}

					const doc = view.state.doc.children?.join("\n") || "";

					let selection: number | null = null;
					if (view.state.selection.ranges[0]?.from === view.state.selection.ranges[0]?.to) {
						selection = view.state.selection.ranges[0].from;
					}

					let line = doc.slice(node.from, doc.indexOf("\n", node.from));

					let flag: string | undefined = undefined;

					for (let f of org_flags) {
						if (line.startsWith(f)) {
							flag = f;
							break;
						}
					}

					if (flag === undefined) return;

					const range_start = node.from;
					const range_end = range_start + flag.length;

					const line_number = view.state.doc.lineAt(range_start).number - 1;

					if (selection === null || selection < range_start || selection > range_end) {
						builder.add(
							range_start,
							range_end,
							Decoration.replace({
								widget: new FlagWidget(flag, line_number),
							})
						);
					}

					let tokens = tokenize_todo_item(line);

					for (let token of tokens) {
						if (token.type === TokenType.Date) {
							const date = parse_date(token.value);
							if (date === null) continue;

							const range_start = node.from + line.indexOf(token.value);
							const range_end = range_start + token.value.length;

							if (selection === null || selection < range_start || selection > range_end) {
								builder.add(
									range_start,
									range_end,
									Decoration.replace({
										widget: new DateWidget(token.value),
									})
								);
							}
						}
					}

				},
			});
		}

		return builder.finish();
	}
}

const pluginSpec: PluginSpec<EditorPlugin> = {
	decorations: (value: EditorPlugin) => value.decorations,
};

export const editorPlugin = ViewPlugin.fromClass(
	EditorPlugin,
	pluginSpec
);
