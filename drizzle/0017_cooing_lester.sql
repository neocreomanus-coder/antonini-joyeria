ALTER TABLE `products` ADD `perfumeryStyle` enum('arabe');--> statement-breakpoint
UPDATE `products` SET `perfumeryStyle` = 'arabe', `gender` = NULL WHERE `gender` = 'arabe';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `gender` enum('masculino','femenino','unisex','ninos');
