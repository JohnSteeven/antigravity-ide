const User = require("../models/User");
const Article = require("../models/Article");
const Notification = require("../models/Notification");
const quotes = require("../data/quotes");

async function createNotification(userId, title, message, type) {
  return Notification.create({
    user: userId,
    title,
    message,
    type,
    status: "unread"
  });
}

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

class NotificationSchedulerService {
  /**
   * Daily Quotes Handler — runs hourly.
   * Compares current server hour to user's preferred hour.
   * Avoids duplicate sends using lastQuoteSentAt check.
   */
  async handleDailyQuotes() {
    try {
      const now = new Date();
      const currentHour = now.getHours();

      // Find users with dailyQuotes enabled
      const users = await User.find({
        "notificationPreferences.dailyQuote.enabled": true,
        isDeleted: false,
        status: "ACTIVE"
      });

      for (const user of users) {
        const prefHour = user.notificationPreferences.dailyQuote.time?.hour ?? 9;

        // Compare hour (server-time only for v1, per-user timezone can be integrated here later)
        if (currentHour !== prefHour) {
          continue;
        }

        // Dedup guard: check if already sent today
        if (isSameDay(user.notificationPreferences.lastQuoteSentAt, now)) {
          continue;
        }

        let sentQuotes = user.notificationPreferences.sentQuotes || [];
        let nextQuote = quotes.find(q => !sentQuotes.includes(q.id));

        if (!nextQuote) {
          // Reset history when all 100 quotes have been used
          sentQuotes = [];
          nextQuote = quotes[0];
        }

        if (nextQuote) {
          await createNotification(
            user._id,
            "Today's Reflection",
            `"${nextQuote.text}" — ${nextQuote.author}`,
            "daily_quote"
          );

          sentQuotes.push(nextQuote.id);
          user.notificationPreferences.sentQuotes = sentQuotes;
          user.notificationPreferences.lastQuoteSentAt = now;
          await user.save();
        }
      }
    } catch (err) {
      console.error("Error in handleDailyQuotes:", err);
    }
  }

  /**
   * New Article Handler — triggered synchronously or fire-and-forget on publish.
   * Notifies users with in-app alerts and sends email notifications to subscribers.
   */
  async handleNewArticle(article) {
    try {
      if (!article || article.status !== "published") return;

      const [users, subscribers] = await Promise.all([
        User.find({
          "notificationPreferences.newArticles.enabled": true,
          isDeleted: false,
          status: "ACTIVE"
        }),
        require("../models/Subscriber").find({ active: true, isDeleted: false }).lean(),
      ]);

      // 1. In-app notifications
      const userNotifications = users.map(user =>
        createNotification(
          user._id,
          "New Story Available",
          `"${article.title}"`,
          "article"
        )
      );

      // 2. Subscriber Email notifications
      const emailService = require("./emailService");
      const emailDispatches = subscribers.map(sub =>
        emailService.sendNewArticleNotificationEmail({ to: sub.email, article }).catch(err => {
          console.warn('[notifications] New-article email delivery failed.', { errorType: err?.name || 'Error' });
        })
      );

      await Promise.all([...userNotifications, ...emailDispatches]);
    } catch (err) {
      console.error('[notifications] New-article handler failed.', { errorType: err?.name || 'Error' });
    }
  }

  /**
   * Reading Reminders Handler — runs once daily.
   * Targets users inactive for >= 3 days.
   */
  async handleReadingReminders() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const users = await User.find({
        "notificationPreferences.readingReminders.enabled": true,
        "notificationPreferences.lastActiveAt": { $ne: null, $lt: threeDaysAgo },
        $or: [
          { "notificationPreferences.lastReadingReminderSentAt": null },
          { "notificationPreferences.lastReadingReminderSentAt": { $lt: threeDaysAgo } }
        ],
        isDeleted: false,
        status: "ACTIVE"
      });

      for (const user of users) {
        await createNotification(
          user._id,
          "Reading Reminder",
          "We've added new stories since your last visit.",
          "reminder"
        );

        user.notificationPreferences.lastReadingReminderSentAt = now;
        await user.save();
      }
    } catch (err) {
      console.error("Error in handleReadingReminders:", err);
    }
  }

  /**
   * Weekly Summary Handler — runs once daily.
   * Targets users who haven't received a summary in >= 7 days.
   */
  async handleWeeklySummary() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const users = await User.find({
        "notificationPreferences.weeklySummary.enabled": true,
        $or: [
          { "notificationPreferences.lastWeeklySummarySentAt": null },
          { "notificationPreferences.lastWeeklySummarySentAt": { $lt: sevenDaysAgo } }
        ],
        isDeleted: false,
        status: "ACTIVE"
      });

      if (users.length === 0) return;

      // Compute statistics for the weekly summary
      const newArticlesCount = await Article.countDocuments({
        status: "published",
        publishedAt: { $gte: sevenDaysAgo },
        isDeleted: false
      });

      const recentArticles = await Article.find({
        status: "published",
        publishedAt: { $gte: sevenDaysAgo },
        isDeleted: false
      });

      let mostPopular = null;
      let recommended = null;

      if (recentArticles.length > 0) {
        const sorted = [...recentArticles].sort(
          (a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0))
        );
        mostPopular = sorted[0];
        recommended = recentArticles.find(a => a.isMustRead || a.isFeatured) || sorted[1] || sorted[0];
      } else {
        // Fallback to all published articles if no new articles this week
        const allArticles = await Article.find({ status: "published", isDeleted: false });
        if (allArticles.length > 0) {
          const sorted = [...allArticles].sort(
            (a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0))
          );
          mostPopular = sorted[0];
          recommended = allArticles.find(a => a.isMustRead || a.isFeatured) || sorted[1] || sorted[0];
        }
      }

      const summaryText = `Weekly Recap: ${newArticlesCount} new stories. Top story: '${mostPopular ? mostPopular.title : "None"}'. Recommended: '${recommended ? recommended.title : "None"}'.`;

      for (const user of users) {
        await createNotification(
          user._id,
          "Weekly Reading Summary",
          summaryText,
          "summary"
        );

        user.notificationPreferences.lastWeeklySummarySentAt = now;
        await user.save();
      }
    } catch (err) {
      console.error("Error in handleWeeklySummary:", err);
    }
  }
}

module.exports = new NotificationSchedulerService();
