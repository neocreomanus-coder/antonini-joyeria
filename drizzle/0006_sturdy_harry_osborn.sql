ALTER TABLE `orders` ADD `paymentMethod` enum('contraentrega','wompi') DEFAULT 'contraentrega' NOT NULL;
--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentStatus` enum('pendiente_contraentrega','pendiente_comprobante','comprobante_enviado','verificado') DEFAULT 'pendiente_contraentrega' NOT NULL;
