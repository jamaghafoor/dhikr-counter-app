package com.tasbeehdigitalapp.reminders

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class DhikrReminderSchedulerTest {
  private fun time(zone: String, year: Int, month: Int, day: Int, hour: Int, minute: Int) =
    Calendar.getInstance(TimeZone.getTimeZone(zone)).apply {
      clear()
      set(year, month - 1, day, hour, minute, 0)
    }

  @Test fun schedulesTheNextLocalTimeToday() {
    val now = time("Asia/Karachi", 2026, 10, 26, 5, 59)
    assertEquals(time("Asia/Karachi", 2026, 10, 26, 6, 0).timeInMillis, DhikrReminderScheduler.nextOccurrence(6, 0, now))
  }

  @Test fun doesNotDeliverAMissedReminderImmediately() {
    val now = time("Asia/Karachi", 2026, 10, 26, 6, 1)
    assertEquals(time("Asia/Karachi", 2026, 10, 27, 6, 0).timeInMillis, DhikrReminderScheduler.nextOccurrence(6, 0, now))
  }

  @Test fun exactBoundarySchedulesTomorrowWithoutALoop() {
    val now = time("Asia/Karachi", 2026, 10, 26, 21, 0)
    assertEquals(time("Asia/Karachi", 2026, 10, 27, 21, 0).timeInMillis, DhikrReminderScheduler.nextOccurrence(21, 0, now))
  }

  @Test fun preservesSixAmAcrossSpringDaylightSavingChange() {
    val now = time("America/New_York", 2026, 3, 7, 6, 1)
    val next = DhikrReminderScheduler.nextOccurrence(6, 0, now)
    assertEquals(time("America/New_York", 2026, 3, 8, 6, 0).timeInMillis, next)
    assertTrue(next - now.timeInMillis < 24 * 60 * 60 * 1000L)
  }

  @Test fun preservesSixAmAcrossAutumnDaylightSavingChange() {
    val now = time("America/New_York", 2026, 10, 31, 6, 1)
    val next = DhikrReminderScheduler.nextOccurrence(6, 0, now)
    assertEquals(time("America/New_York", 2026, 11, 1, 6, 0).timeInMillis, next)
    assertTrue(next - now.timeInMillis > 24 * 60 * 60 * 1000L)
  }

  @Test fun eachReminderUsesTheCurrentDeviceTimeZone() {
    for (zone in listOf("Asia/Karachi", "Asia/Dubai", "Europe/London", "America/Los_Angeles")) {
      val now = time(zone, 2026, 10, 26, 0, 0)
      for (hour in listOf(6, 13, 18, 21)) {
        assertEquals(time(zone, 2026, 10, 26, hour, 0).timeInMillis, DhikrReminderScheduler.nextOccurrence(hour, 0, now))
      }
    }
  }
}
