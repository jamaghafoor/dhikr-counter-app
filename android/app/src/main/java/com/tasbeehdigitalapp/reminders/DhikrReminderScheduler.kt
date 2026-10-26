package com.tasbeehdigitalapp.reminders

import android.Manifest
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.tasbeehdigitalapp.MainActivity
import com.tasbeehdigitalapp.R
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

internal data class DhikrReminder(val id: String, val hour: Int, val minute: Int, val title: String, val body: String) {
  fun toJSON() = JSONObject().put("id", id).put("hour", hour).put("minute", minute).put("title", title).put("body", body)
}

/** AlarmManager owns delivery; no React Native process, network or background service is needed. */
internal object DhikrReminderScheduler {
  const val CHANNEL_ID = "daily-dhikr"
  const val FIRE_ACTION = "com.tasbeehdigitalapp.DHIKR_REMINDER"
  private const val PREFS = "dhikr-reminders-v1"
  private const val CATALOG = "catalog"
  private const val ENABLED = "enabled"
  private const val PERMISSION_ASKED = "permission-asked"
  private val lock = Any()

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
  private fun alarms(context: Context) = context.getSystemService(AlarmManager::class.java)
  private fun notifications(context: Context) = context.getSystemService(NotificationManager::class.java)

  fun createChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, "Daily dhikr reminders", NotificationManager.IMPORTANCE_DEFAULT)
      channel.description = "Gentle reminders for your morning, afternoon, evening and night dhikr."
      notifications(context).createNotificationChannel(channel)
    }
  }

  fun catalog(context: Context): List<DhikrReminder> {
    val array = JSONArray(prefs(context).getString(CATALOG, "[]"))
    return (0 until array.length()).map { index ->
      val entry = array.getJSONObject(index)
      DhikrReminder(entry.getString("id"), entry.getInt("hour"), entry.getInt("minute"), entry.getString("title"), entry.getString("body"))
    }
  }

  fun enabledIds(context: Context): Set<String> = prefs(context).getStringSet(ENABLED, emptySet())!!.toSet()
  fun permissionAsked(context: Context) = prefs(context).getBoolean(PERMISSION_ASKED, false)
  fun markPermissionAsked(context: Context) { check(prefs(context).edit().putBoolean(PERMISSION_ASKED, true).commit()) }

  fun authorized(context: Context): Boolean {
    if (Build.VERSION.SDK_INT >= 33 && context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false
    if (!notifications(context).areNotificationsEnabled()) return false
    if (Build.VERSION.SDK_INT >= 26 && notifications(context).getNotificationChannel(CHANNEL_ID)?.importance == NotificationManager.IMPORTANCE_NONE) return false
    return true
  }

  fun precise(context: Context) = Build.VERSION.SDK_INT < 31 || alarms(context).canScheduleExactAlarms()

  fun configure(context: Context, entries: List<DhikrReminder>) = synchronized(lock) {
    createChannel(context)
    val previous = catalog(context)
    val validIds = entries.map { it.id }.toSet()
    previous.filter { it.id !in validIds }.forEach { cancel(context, it.id) }
    val json = JSONArray().apply { entries.forEach { put(it.toJSON()) } }
    check(prefs(context).edit().putString(CATALOG, json.toString()).putStringSet(ENABLED, enabledIds(context).intersect(validIds)).commit())
    reconcile(context)
  }

  fun setEnabled(context: Context, ids: Set<String>) = synchronized(lock) {
    require(catalog(context).map { it.id }.containsAll(ids)) { "Unknown reminder" }
    val previous = enabledIds(context)
    check(prefs(context).edit().putStringSet(ENABLED, ids).commit())
    try { reconcile(context) } catch (error: Exception) {
      prefs(context).edit().putStringSet(ENABLED, previous).commit()
      runCatching { reconcile(context) }
      throw error
    }
  }

  fun reconcile(context: Context) = synchronized(lock) {
    createChannel(context)
    val enabled = enabledIds(context)
    val allowed = authorized(context)
    catalog(context).forEach { reminder ->
      if (allowed && reminder.id in enabled) scheduleNext(context, reminder) else cancel(context, reminder.id)
    }
    if (enabled.isEmpty()) notifications(context).cancel("dhikr-test", 0)
  }

  internal fun nextOccurrence(hour: Int, minute: Int, now: Calendar = Calendar.getInstance()): Long {
    val next = (now.clone() as Calendar).apply {
      set(Calendar.HOUR_OF_DAY, hour)
      set(Calendar.MINUTE, minute)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    if (next.timeInMillis <= now.timeInMillis) next.add(Calendar.DAY_OF_YEAR, 1)
    return next.timeInMillis
  }

  private fun pending(context: Context, id: String): PendingIntent = PendingIntent.getBroadcast(
    context, id.hashCode(), Intent(context, DhikrReminderReceiver::class.java).setAction(FIRE_ACTION).putExtra("reminder-id", id),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  )

  private fun scheduleNext(context: Context, reminder: DhikrReminder) {
    val timestamp = nextOccurrence(reminder.hour, reminder.minute)
    val intent = pending(context, reminder.id)
    // Recompute tomorrow from the local calendar, never from a fixed 24-hour interval.
    if (precise(context)) {
      try { alarms(context).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestamp, intent); return }
      catch (_: SecurityException) { /* Access can be revoked between checking and scheduling. */ }
    }
    alarms(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestamp, intent)
  }

  private fun cancel(context: Context, id: String) {
    alarms(context).cancel(pending(context, id))
    notifications(context).cancel(id, 0)
  }

  fun deliver(context: Context, id: String) = synchronized(lock) {
    val reminder = catalog(context).find { it.id == id } ?: return@synchronized
    if (id !in enabledIds(context) || !authorized(context)) return@synchronized
    // Schedule the following day even when the app has never been opened today.
    scheduleNext(context, reminder)
    val day = Calendar.getInstance().let { "${it.get(Calendar.YEAR)}-${it.get(Calendar.DAY_OF_YEAR)}" }
    if (prefs(context).getString("delivered-$id", null) == day) return@synchronized
    notify(context, reminder, false)
    prefs(context).edit().putString("delivered-$id", day).apply()
  }

  fun sendTest(context: Context) = synchronized(lock) {
    check(authorized(context)) { "Notifications are not allowed" }
    val reminder = catalog(context).firstOrNull() ?: error("Reminders are not configured")
    notify(context, reminder, true)
  }

  private fun notify(context: Context, reminder: DhikrReminder, test: Boolean) {
    val open = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val contentIntent = PendingIntent.getActivity(context, 2010, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(context, CHANNEL_ID) else Notification.Builder(context)
    builder.setSmallIcon(R.drawable.ic_dhikr_notification)
      .setColor(0xFF174E40.toInt()).setContentTitle(reminder.title).setContentText(reminder.body)
      .setStyle(Notification.BigTextStyle().bigText(reminder.body)).setContentIntent(contentIntent)
      .setAutoCancel(true).setCategory(Notification.CATEGORY_REMINDER).setVisibility(Notification.VISIBILITY_PRIVATE)
    if (Build.VERSION.SDK_INT < 26) builder.setDefaults(Notification.DEFAULT_SOUND)
    if (test) builder.setSubText("Test reminder")
    notifications(context).notify(if (test) "dhikr-test" else reminder.id, 0, builder.build())
  }
}
