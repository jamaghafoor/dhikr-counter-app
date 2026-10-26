package com.tasbeehdigitalapp.reminders

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class DhikrRemindersPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == DhikrRemindersModule.NAME) DhikrRemindersModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(DhikrRemindersModule.NAME to ReactModuleInfo(
      DhikrRemindersModule.NAME, DhikrRemindersModule.NAME,
      false, false, false, true,
    ))
  }
}
