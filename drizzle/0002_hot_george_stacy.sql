CREATE TABLE `site_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`config_key` varchar(100) NOT NULL,
	`config_value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_config_config_key_unique` UNIQUE(`config_key`)
);
--> statement-breakpoint
ALTER TABLE `order_items` MODIFY COLUMN `productSnapshot` text;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `shippingAddress` text;--> statement-breakpoint
ALTER TABLE `product_variants` MODIFY COLUMN `priceModifier` decimal(10,2);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `imageUrls` text;--> statement-breakpoint
ALTER TABLE `products` ADD `homeSection` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD `volumeMl` int;--> statement-breakpoint
ALTER TABLE `products` ADD `gender` enum('masculino','femenino','unisex');