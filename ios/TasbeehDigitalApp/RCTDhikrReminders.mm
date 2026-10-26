#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <TasbeehSpecs/TasbeehSpecs.h>

static NSString *const DRCatalogKey = @"dhikr.reminders.catalog.v1";
static NSString *const DREnabledKey = @"dhikr.reminders.enabled.v1";
static NSString *const DRPrefix = @"dhikr.";

@interface RCTDhikrReminders : NSObject <NativeDhikrRemindersSpec>
@end

@implementation RCTDhikrReminders
RCT_EXPORT_MODULE(NativeDhikrReminders)

+ (BOOL)requiresMainQueueSetup { return NO; }

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeDhikrRemindersSpecJSI>(params);
}

// Serialize asynchronous OS operations, including an enable followed immediately by disable.
- (NSOperationQueue *)queue {
  static NSOperationQueue *queue;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    queue = [NSOperationQueue new];
    queue.name = @"com.tasbeehdigitalapp.reminders";
    queue.maxConcurrentOperationCount = 1;
  });
  return queue;
}

- (NSArray<NSDictionary *> *)catalog { return [[NSUserDefaults standardUserDefaults] arrayForKey:DRCatalogKey] ?: @[]; }
- (NSArray<NSString *> *)enabledIds { return [[NSUserDefaults standardUserDefaults] stringArrayForKey:DREnabledKey] ?: @[]; }
- (NSString *)identifier:(NSString *)reminderId { return [DRPrefix stringByAppendingString:reminderId]; }

- (UNNotificationSettings *)settings {
  __block UNNotificationSettings *settings;
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *result) {
    settings = result;
    dispatch_semaphore_signal(semaphore);
  }];
  dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
  return settings;
}

- (BOOL)authorized:(UNNotificationSettings *)settings {
  return settings.authorizationStatus == UNAuthorizationStatusAuthorized || settings.authorizationStatus == UNAuthorizationStatusProvisional || settings.authorizationStatus == UNAuthorizationStatusEphemeral;
}

- (NSDictionary *)result:(UNNotificationSettings *)settings {
  NSString *status = @"denied";
  if (settings.authorizationStatus == UNAuthorizationStatusNotDetermined) status = @"notDetermined";
  else if (settings.authorizationStatus == UNAuthorizationStatusProvisional) status = @"provisional";
  else if ([self authorized:settings]) status = @"authorized";
  return @{@"enabledIds": [self enabledIds], @"authorizationStatus": status, @"precise": @YES};
}

- (NSError *)error:(NSString *)message {
  return [NSError errorWithDomain:@"DhikrReminders" code:1 userInfo:@{NSLocalizedDescriptionKey: message}];
}

- (UNMutableNotificationContent *)content:(NSDictionary *)reminder {
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = reminder[@"title"];
  content.body = reminder[@"body"];
  content.sound = [UNNotificationSound defaultSound];
  content.threadIdentifier = @"daily-dhikr";
  return content;
}

- (NSError *)applyIds:(NSArray<NSString *> *)ids settings:(UNNotificationSettings *)settings {
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  BOOL allowed = [self authorized:settings];
  NSMutableArray<NSString *> *cancel = [NSMutableArray new];
  dispatch_group_t group = dispatch_group_create();
  NSLock *lock = [NSLock new];
  __block NSError *failure;
  for (NSDictionary *reminder in [self catalog]) {
    NSString *identifier = [self identifier:reminder[@"id"]];
    if (!allowed || ![ids containsObject:reminder[@"id"]]) { [cancel addObject:identifier]; continue; }
    // Only wall-clock components: the system repeats daily in the device's current time zone.
    NSDateComponents *date = [NSDateComponents new];
    date.hour = [reminder[@"hour"] integerValue];
    date.minute = [reminder[@"minute"] integerValue];
    date.second = 0;
    UNCalendarNotificationTrigger *trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:date repeats:YES];
    UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:identifier content:[self content:reminder] trigger:trigger];
    dispatch_group_enter(group);
    // Reusing an identifier replaces the existing request instead of duplicating it.
    [center addNotificationRequest:request withCompletionHandler:^(NSError *error) {
      if (error) { [lock lock]; failure = error; [lock unlock]; }
      dispatch_group_leave(group);
    }];
  }
  [center removePendingNotificationRequestsWithIdentifiers:cancel];
  [center removeDeliveredNotificationsWithIdentifiers:cancel];
  if (!ids.count) {
    [center removePendingNotificationRequestsWithIdentifiers:@[@"dhikr.test"]];
    [center removeDeliveredNotificationsWithIdentifiers:@[@"dhikr.test"]];
  }
  dispatch_group_wait(group, DISPATCH_TIME_FOREVER);
  return failure;
}

- (void)configure:(NSArray *)reminders resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[self queue] addOperationWithBlock:^{
    NSMutableSet *validIds = [NSMutableSet new];
    BOOL valid = reminders.count > 0 && reminders.count <= 16;
    for (id value in reminders) {
      if (![value isKindOfClass:[NSDictionary class]]) { valid = NO; break; }
      NSDictionary *entry = value;
      NSString *identifier = entry[@"id"];
      NSNumber *hour = entry[@"hour"], *minute = entry[@"minute"];
      if (![identifier isKindOfClass:[NSString class]] || !identifier.length || [validIds containsObject:identifier] ||
          ![hour isKindOfClass:[NSNumber class]] || ![minute isKindOfClass:[NSNumber class]] ||
          hour.doubleValue != hour.integerValue || minute.doubleValue != minute.integerValue ||
          hour.integerValue < 0 || hour.integerValue > 23 || minute.integerValue < 0 || minute.integerValue > 59 ||
          ![entry[@"title"] isKindOfClass:[NSString class]] || ![entry[@"body"] isKindOfClass:[NSString class]]) { valid = NO; break; }
      [validIds addObject:identifier];
    }
    if (!valid) { reject(@"E_REMINDER_CONFIG", @"Invalid reminder catalog", nil); return; }
    NSMutableArray *obsolete = [NSMutableArray new];
    for (NSDictionary *entry in [self catalog]) if (![validIds containsObject:entry[@"id"]]) [obsolete addObject:[self identifier:entry[@"id"]]];
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:obsolete];
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:obsolete];
    NSMutableArray *enabled = [NSMutableArray new];
    for (NSString *identifier in [self enabledIds]) if ([validIds containsObject:identifier]) [enabled addObject:identifier];
    [[NSUserDefaults standardUserDefaults] setObject:reminders forKey:DRCatalogKey];
    [[NSUserDefaults standardUserDefaults] setObject:enabled forKey:DREnabledKey];
    UNNotificationSettings *settings = [self settings];
    NSError *error = [self applyIds:enabled settings:settings];
    if (error) reject(@"E_REMINDER_SCHEDULE", error.localizedDescription, error);
    else resolve([self result:settings]);
  }];
}

- (void)setEnabledIds:(NSArray *)ids resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[self queue] addOperationWithBlock:^{
    NSSet *known = [NSSet setWithArray:[[self catalog] valueForKey:@"id"]];
    NSSet *requested = [NSSet setWithArray:ids];
    if (![requested isSubsetOfSet:known]) { reject(@"E_REMINDER_IDS", @"Unknown reminder", nil); return; }
    UNNotificationSettings *settings = [self settings];
    NSArray *previous = [self enabledIds];
    NSError *error = [self applyIds:requested.allObjects settings:settings];
    if (error) {
      [self applyIds:previous settings:settings];
      reject(@"E_REMINDER_SCHEDULE", error.localizedDescription, error);
      return;
    }
    [[NSUserDefaults standardUserDefaults] setObject:requested.allObjects forKey:DREnabledKey];
    resolve([self result:settings]);
  }];
}

- (void)requestPermission:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound) completionHandler:^(BOOL granted, NSError *error) {
      if (error) { reject(@"E_NOTIFICATION_PERMISSION", error.localizedDescription, error); return; }
      [[self queue] addOperationWithBlock:^{ resolve([self result:[self settings]]); }];
    }];
  });
}

- (void)openSettings:(BOOL)preciseAlarms resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *destination = UIApplicationOpenSettingsURLString;
    if (@available(iOS 15.4, *)) destination = UIApplicationOpenNotificationSettingsURLString;
    NSURL *url = [NSURL URLWithString:destination];
    [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {
      if (success) resolve(nil); else reject(@"E_NOTIFICATION_SETTINGS", @"Unable to open notification settings", nil);
    }];
  });
}

- (void)sendTest:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  [[self queue] addOperationWithBlock:^{
    if (![self authorized:[self settings]]) { reject(@"E_NOTIFICATION_PERMISSION", @"Notifications are not allowed", nil); return; }
    NSDictionary *reminder = [self catalog].firstObject;
    if (!reminder) { reject(@"E_REMINDER_CONFIG", @"Reminders are not configured", nil); return; }
    UNMutableNotificationContent *content = [self content:reminder];
    content.subtitle = @"Test reminder";
    UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:@"dhikr.test" content:content trigger:[UNTimeIntervalNotificationTrigger triggerWithTimeInterval:1 repeats:NO]];
    [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request withCompletionHandler:^(NSError *error) {
      if (error) reject(@"E_NOTIFICATION_TEST", error.localizedDescription, error); else resolve(nil);
    }];
  }];
}
@end
