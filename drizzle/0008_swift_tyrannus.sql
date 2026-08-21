ALTER TABLE `orders` MODIFY `status` enum('pendiente','en_proceso','enviado','despachado','entregado','cancelado') DEFAULT 'pendiente' NOT NULL;
--> statement-breakpoint
UPDATE `orders`
SET `status` = CASE
  WHEN `status` = 'enviado' THEN 'despachado'
  WHEN `status` IN ('en_proceso', 'cancelado') THEN 'pendiente'
  ELSE `status`
END;
--> statement-breakpoint
ALTER TABLE `orders` MODIFY `status` enum('pendiente','despachado','entregado') DEFAULT 'pendiente' NOT NULL;
--> statement-breakpoint
ALTER TABLE `orders` ADD `interrapidisimoGuide` varchar(100);
