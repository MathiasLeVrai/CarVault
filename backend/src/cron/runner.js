const { startAlertCron } = require('./alert.cron');
const { startMonthlyReportCron } = require('./monthly-report.cron');
const { startWeeklyDigestCron } = require('./weekly-digest.cron');
const { startEngagementCron } = require('./engagement.cron');
const { startBudgetCron } = require('./budget.cron');

function startAllCrons() {
  startAlertCron();
  startMonthlyReportCron();
  startWeeklyDigestCron();
  startEngagementCron();
  startBudgetCron();
  console.log('[CRON] All schedules registered');
}

module.exports = { startAllCrons };
