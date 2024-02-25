export function flag_colour(flag: string): string {
	const RED = "var(--color-red)";
	const GREEN = "var(--color-green)";
	const YELLOW = "var(--color-yellow)";

	switch (flag) {
		case "TODO":
			return RED;
		case "DONE":
			return GREEN;
		case "WAITING":
			return YELLOW;
		default:
			return "var(--text-normal)";
	}
}
