import Foundation
import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()

    // 需要读取的健康数据类型
    private let readTypes: Set<HKObjectType> = [
        HKObjectType.quantityType(forIdentifier: .heartRate)!,
        HKObjectType.quantityType(forIdentifier: .stepCount)!,
        HKObjectType.quantityType(forIdentifier: .sleepAnalysis)!,
        HKObjectType.quantityType(forIdentifier: .oxygenSaturation)!,
        HKObjectType.quantityType(forIdentifier: .bodyMass)!,
        HKObjectType.quantityType(forIdentifier: .bloodPressureSystolic)!,
        HKObjectType.quantityType(forIdentifier: .bloodPressureDiastolic)!,
        HKObjectType.quantityType(forIdentifier: .bloodGlucose)!,
        HKObjectType.quantityType(forIdentifier: .bodyTemperature)!,
    ]

    // 请求 HealthKit 授权
    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit 不可用")
            return
        }

        healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if success {
                call.resolve(["authorized": true])
            } else {
                call.reject("HealthKit 授权失败: \(error?.localizedDescription ?? "未知错误")")
            }
        }
    }

    // 获取健康数据
    @objc func fetchHealthData(_ call: CAPPluginCall) {
        guard let typeStr = call.getString("type") else {
            call.reject("缺少 type 参数")
            return
        }

        let startDateStr = call.getString("startDate") ?? ""
        let endDateStr = call.getString("endDate") ?? ""

        guard let hkType = mapTypeToHK(typeStr),
              let startDate = ISO8601DateFormatter().date(from: startDateStr),
              let endDate = ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("参数格式错误")
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        let query = HKSampleQuery(sampleType: hkType, predicate: predicate, limit: 100, sortDescriptors: [sortDescriptor]) { _, samples, error in
            guard let samples = samples as? [HKQuantitySample] else {
                call.resolve(["values": []])
                return
            }

            let values = samples.map { sample -> [String: Any] in
                return [
                    "value": self.getValue(for: sample),
                    "unit": self.getUnit(for: sample),
                    "date": ISO8601DateFormatter().string(from: sample.startDate),
                    "source": sample.sourceRevision.source.name
                ]
            }
            call.resolve(["values": values])
        }

        healthStore.execute(query)
    }

    // 开始后台同步
    @objc func startBackgroundSync(_ call: CAPPluginCall) {
        // 为每种数据类型启用后台投递
        for type in readTypes {
            if let sampleType = type as? HKSampleType {
                healthStore.enableBackgroundDelivery(for: sampleType, frequency: .hourly) { success, error in
                    if !success {
                        print("后台同步启用失败: \(type.identifier)")
                    }
                }
            }
        }
        call.resolve(["started": true])
    }

    // 停止后台同步
    @objc func stopBackgroundSync(_ call: CAPPluginCall) {
        for type in readTypes {
            if let sampleType = type as? HKSampleType {
                healthStore.disableBackgroundDelivery(for: sampleType)
            }
        }
        call.resolve(["stopped": true])
    }

    // MARK: - 辅助方法

    private func mapTypeToHK(_ type: String) -> HKQuantityType? {
        switch type {
        case "heart_rate": return HKQuantityType.quantityType(forIdentifier: .heartRate)
        case "steps": return HKQuantityType.quantityType(forIdentifier: .stepCount)
        case "sleep": return HKQuantityType.quantityType(forIdentifier: .sleepAnalysis)
        case "blood_oxygen": return HKQuantityType.quantityType(forIdentifier: .oxygenSaturation)
        case "weight": return HKQuantityType.quantityType(forIdentifier: .bodyMass)
        case "blood_pressure": return HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic)
        case "blood_sugar": return HKQuantityType.quantityType(forIdentifier: .bloodGlucose)
        case "temperature": return HKQuantityType.quantityType(forIdentifier: .bodyTemperature)
        default: return nil
        }
    }

    private func getValue(for sample: HKQuantitySample) -> Double {
        switch sample.quantityType.identifier {
        case HKQuantityTypeIdentifier.heartRate.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        case HKQuantityTypeIdentifier.stepCount.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.count())
        case HKQuantityTypeIdentifier.oxygenSaturation.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.percent()) * 100
        case HKQuantityTypeIdentifier.bodyMass.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo))
        case HKQuantityTypeIdentifier.bloodPressureSystolic.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.millimeterOfMercury())
        case HKQuantityTypeIdentifier.bloodGlucose.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.millimolesPerLiter)
        case HKQuantityTypeIdentifier.bodyTemperature.rawValue:
            return sample.quantity.doubleValue(for: HKUnit.degreeCelsius())
        default: return 0
        }
    }

    private func getUnit(for sample: HKQuantitySample) -> String {
        switch sample.quantityType.identifier {
        case HKQuantityTypeIdentifier.heartRate.rawValue: return "bpm"
        case HKQuantityTypeIdentifier.stepCount.rawValue: return "步"
        case HKQuantityTypeIdentifier.oxygenSaturation.rawValue: return "%"
        case HKQuantityTypeIdentifier.bodyMass.rawValue: return "kg"
        case HKQuantityTypeIdentifier.bloodPressureSystolic.rawValue: return "mmHg"
        case HKQuantityTypeIdentifier.bloodGlucose.rawValue: return "mmol/L"
        case HKQuantityTypeIdentifier.bodyTemperature.rawValue: return "°C"
        default: return ""
        }
    }
}
