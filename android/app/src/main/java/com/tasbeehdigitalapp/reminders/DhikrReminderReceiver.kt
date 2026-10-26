package com.tasbeehdigitalapp.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class DhikrReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try {
      if (intent.action == DhikrReminderScheduler.FIRE_ACTION) {
        intent.getStringExtra("reminder-id")?.let { DhikrReminderScheduler.deliver(context, it) }
      } else if (intent.action in setOf(
          Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED,
          Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED,
          "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED",
      )) {
        DhikrReminderScheduler.reconcile(context)
      }
    } catch (error: Exception) {
      // A revoked permission or unavailable OS scheduler must never crash a background receiver.
      Log.e("DhikrReminders", "Unable to schedule or deliver a local reminder", error)
    }
  }
}
