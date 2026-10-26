package com.tasbeehdigitalapp.reminders

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

@ReactModule(name = DhikrRemindersModule.NAME)
class DhikrRemindersModule(context: ReactApplicationContext) : NativeDhikrRemindersSpec(context), PermissionListener {
  companion object { const val NAME = "NativeDhikrReminders"; private const val PERMISSION_REQUEST = 6406 }
  private var permissionPromise: Promise? = null
  override fun getName() = NAME

  private fun result() = Arguments.createMap().apply {
    putArray("enabledIds", Arguments.fromList(DhikrReminderScheduler.enabledIds(reactApplicationContext).toList()))
    val allowed = DhikrReminderScheduler.authorized(reactApplicationContext)
    putString("authorizationStatus", if (allowed) "authorized" else if (Build.VERSION.SDK_INT >= 33 && !DhikrReminderScheduler.permissionAsked(reactApplicationContext)) "notDetermined" else "denied")
    putBoolean("precise", DhikrReminderScheduler.precise(reactApplicationContext))
  }

  private fun respond(promise: Promise, block: () -> Unit) {
    try { block(); promise.resolve(result()) }
    catch (error: Exception) { promise.reject("E_DHIKR_REMINDERS", error.message, error) }
  }

  override fun configure(reminders: ReadableArray, promise: Promise) = respond(promise) {
    require(reminders.size() in 1..16) { "Invalid reminder catalog" }
    val entries = (0 until reminders.size()).map { index ->
      val entry = requireNotNull(reminders.getMap(index))
      val id = requireNotNull(entry.getString("id"))
      val title = requireNotNull(entry.getString("title"))
      val body = requireNotNull(entry.getString("body"))
      val hour = entry.getDouble("hour")
      val minute = entry.getDouble("minute")
      require(id.matches(Regex("[a-z0-9-]{1,64}")) && title.isNotBlank() && body.isNotBlank())
      require(hour % 1 == 0.0 && minute % 1 == 0.0 && hour in 0.0..23.0 && minute in 0.0..59.0)
      DhikrReminder(id, hour.toInt(), minute.toInt(), title, body)
    }
    require(entries.map { it.id }.distinct().size == entries.size)
    DhikrReminderScheduler.configure(reactApplicationContext, entries)
  }

  override fun setEnabledIds(ids: ReadableArray, promise: Promise) = respond(promise) {
    val enabled = (0 until ids.size()).map { requireNotNull(ids.getString(it)) }.toSet()
    DhikrReminderScheduler.setEnabled(reactApplicationContext, enabled)
  }

  override fun requestPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < 33 || DhikrReminderScheduler.authorized(reactApplicationContext)) {
      promise.resolve(result()); return
    }
    UiThreadUtil.runOnUiThread {
      val activity = reactApplicationContext.currentActivity as? PermissionAwareActivity
      if (activity == null) { promise.reject("E_NO_ACTIVITY", "Open the app to enable notifications"); return@runOnUiThread }
      if (permissionPromise != null) { promise.reject("E_PERMISSION_PENDING", "A notification permission request is already open"); return@runOnUiThread }
      try {
        DhikrReminderScheduler.markPermissionAsked(reactApplicationContext)
        permissionPromise = promise
        activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), PERMISSION_REQUEST, this)
      } catch (error: Exception) {
        permissionPromise = null
        promise.reject("E_PERMISSION", error.message, error)
      }
    }
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray): Boolean {
    if (requestCode != PERMISSION_REQUEST) return false
    permissionPromise?.resolve(result())
    permissionPromise = null
    return true
  }

  override fun openSettings(preciseAlarms: Boolean, promise: Promise) {
    try {
      val intent = if (preciseAlarms && Build.VERSION.SDK_INT >= 31) {
        Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${reactApplicationContext.packageName}"))
      } else {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, reactApplicationContext.packageName)
      }
      reactApplicationContext.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(null)
    } catch (error: Exception) { promise.reject("E_NOTIFICATION_SETTINGS", error.message, error) }
  }

  override fun sendTest(promise: Promise) {
    try { DhikrReminderScheduler.sendTest(reactApplicationContext); promise.resolve(null) }
    catch (error: Exception) { promise.reject("E_NOTIFICATION_TEST", error.message, error) }
  }

  override fun invalidate() {
    permissionPromise?.reject("E_REMINDERS_CLOSED", "The notification permission request was interrupted")
    permissionPromise = null
    super.invalidate()
  }
}
