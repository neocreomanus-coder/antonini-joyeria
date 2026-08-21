ALTER TABLE `orders` ADD `publicToken` varchar(64);
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_publicToken_unique` UNIQUE(`publicToken`);
