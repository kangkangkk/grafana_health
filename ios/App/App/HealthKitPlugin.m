#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HealthKitPlugin, "HealthKit",
    CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(fetchHealthData, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startBackgroundSync, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopBackgroundSync, CAPPluginReturnPromise);
)
