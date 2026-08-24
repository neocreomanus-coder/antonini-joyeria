CREATE TABLE `order_sequences` (
	`paymentMethod` enum('contraentrega','wompi') NOT NULL,
	`nextNumber` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_sequences_paymentMethod` PRIMARY KEY(`paymentMethod`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `orderNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`);