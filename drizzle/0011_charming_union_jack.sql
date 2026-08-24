CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`discountPercent` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `promoCode` varchar(64);--> statement-breakpoint
ALTER TABLE `orders` ADD `promoDiscountPercent` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `promoDiscountAmount` decimal(12,2);