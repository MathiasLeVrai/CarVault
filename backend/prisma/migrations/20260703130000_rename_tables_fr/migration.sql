-- Renommage des tables en français (tokens conservés en anglais)
ALTER TABLE "users" RENAME TO "utilisateurs";
ALTER TABLE "vehicles" RENAME TO "vehicules";
ALTER TABLE "expenses" RENAME TO "depenses";
ALTER TABLE "alerts" RENAME TO "alertes";
ALTER TABLE "mileage_entries" RENAME TO "entrees_kilometrage";
ALTER TABLE "fuel_entries" RENAME TO "entrees_carburant";
ALTER TABLE "push_subscriptions" RENAME TO "abonnements_push";
ALTER TABLE "share_links" RENAME TO "liens_partage";
