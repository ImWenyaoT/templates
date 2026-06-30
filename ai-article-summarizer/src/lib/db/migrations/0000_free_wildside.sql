CREATE TABLE `summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`one_line` text NOT NULL,
	`short` text NOT NULL,
	`detailed` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `summaries_url_idx` ON `summaries` (`url`);--> statement-breakpoint
CREATE INDEX `summaries_created_at_idx` ON `summaries` (`created_at`);