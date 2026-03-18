-- CreateIndex
CREATE INDEX "alerts_userId_isRead_idx" ON "alerts"("userId", "isRead");

-- CreateIndex
CREATE INDEX "documents_vehicleId_expirationDate_idx" ON "documents"("vehicleId", "expirationDate");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "share_links_vehicleId_userId_idx" ON "share_links"("vehicleId", "userId");

-- CreateIndex
CREATE INDEX "users_stripeSubscriptionId_idx" ON "users"("stripeSubscriptionId");
