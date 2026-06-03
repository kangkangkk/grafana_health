import { useState, useRef } from 'react';
import { Upload, Camera, FileText, AlertCircle, CheckCircle2, ChevronDown, Image } from 'lucide-react';
import type { OcrItem, ReportRecord } from '@/types';
import { takePhoto, pickImage } from '@/plugins/camera';
import { isNative } from '@/plugins/health';

const mockOcrResult: OcrItem[] = [
  { name: '血红蛋白', value: '110', unit: 'g/L', referenceRange: '115-150', isAbnormal: true, interpretation: '略低于正常值，孕期轻度贫血较常见，建议补充铁质，多吃红肉、动物肝脏等含铁食物' },
  { name: '白细胞', value: '8.5', unit: '×10⁹/L', referenceRange: '3.5-9.5', isAbnormal: false, interpretation: '正常范围内，孕期白细胞轻度升高属正常现象' },
  { name: '血小板', value: '180', unit: '×10⁹/L', referenceRange: '125-350', isAbnormal: false, interpretation: '正常范围内' },
  { name: '空腹血糖', value: '5.8', unit: 'mmol/L', referenceRange: '3.9-5.1', isAbnormal: true, interpretation: '高于正常值，需警惕妊娠期糖尿病，建议控制糖分摄入，定期监测血糖' },
  { name: '总蛋白', value: '65', unit: 'g/L', referenceRange: '60-80', isAbnormal: false, interpretation: '正常范围内' },
  { name: '谷丙转氨酶', value: '22', unit: 'U/L', referenceRange: '0-40', isAbnormal: false, interpretation: '正常范围内，肝功能良好' },
];

const mockHistory: ReportRecord[] = [
  { id: '1', userId: 'user-1', pregnancyWeek: 16, reportType: '血常规', imageUrl: '', ocrResult: [], parsedAt: '2025-05-10T10:00:00Z', createdAt: '2025-05-10T10:00:00Z' },
  { id: '2', userId: 'user-1', pregnancyWeek: 12, reportType: '尿常规', imageUrl: '', ocrResult: [], parsedAt: '2025-04-15T10:00:00Z', createdAt: '2025-04-15T10:00:00Z' },
];

export default function Report() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [week, setWeek] = useState(20);
  const [weekOpen, setWeekOpen] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setParsed(false);
    setOcrResult([]);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleNativeImage = (dataUrl: string) => {
    setPreview(dataUrl);
    setFile(null);
    setParsed(false);
    setOcrResult([]);
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result) {
      handleNativeImage(result);
    }
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) {
      handleNativeImage(result);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    handleFileChange(f);
  };

  const handleUpload = async () => {
    if (!preview && !file) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setOcrResult(mockOcrResult);
    setParsed(true);
    setUploading(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold text-dark">报告解析</h2>

      {/* Upload Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="rounded-2xl border-2 border-dashed border-coral-light bg-white p-8 text-center shadow-sm transition-all hover:border-coral hover:shadow-md"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="报告预览" className="mx-auto max-h-48 rounded-xl object-contain" />
            <p className="text-sm text-gray-500">{file?.name ?? '已选择图片'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-coral/10">
              <Upload className="h-8 w-8 text-coral" />
            </div>
            <div>
              <p className="text-sm font-medium text-dark">点击上传或拖拽报告图片</p>
              <p className="mt-1 text-xs text-gray-400">支持 JPG、PNG 格式</p>
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-3">
          {isNative ? (
            <>
              <button
                onClick={handleTakePhoto}
                className="flex items-center gap-1.5 rounded-xl bg-coral-light/30 px-4 py-2 text-sm font-medium text-coral transition-all hover:bg-coral-light/50"
              >
                <Camera className="h-4 w-4" />
                拍照上传
              </button>
              <button
                onClick={handlePickImage}
                className="flex items-center gap-1.5 rounded-xl bg-mint-light/30 px-4 py-2 text-sm font-medium text-mint transition-all hover:bg-mint-light/50"
              >
                <Image className="h-4 w-4" />
                从相册选择
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-coral-light/30 px-4 py-2 text-sm font-medium text-coral transition-all hover:bg-coral-light/50"
              >
                选择文件
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl bg-mint-light/30 px-4 py-2 text-sm font-medium text-mint transition-all hover:bg-mint-light/50"
              >
                <Camera className="h-4 w-4" />
                拍照
              </button>
            </>
          )}
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-dark">孕周:</label>
        <div className="relative">
          <button
            onClick={() => setWeekOpen(!weekOpen)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-dark shadow-sm"
          >
            孕{week}周
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${weekOpen ? 'rotate-180' : ''}`} />
          </button>
          {weekOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              {Array.from({ length: 40 }, (_, i) => i + 1).map((w) => (
                <button
                  key={w}
                  onClick={() => { setWeek(w); setWeekOpen(false); }}
                  className={`block w-full px-4 py-1.5 text-left text-sm ${
                    w === week ? 'bg-coral-light/30 text-coral font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  孕{w}周
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={(!file && !preview) || uploading}
          className="ml-auto rounded-2xl bg-gradient-to-r from-coral to-coral-light px-6 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          {uploading ? '解析中...' : '开始解析'}
        </button>
      </div>

      {/* OCR Results */}
      {parsed && ocrResult.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-dark">解析结果</h3>
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-cream">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">检查项目</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">结果</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">单位</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">参考范围</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody>
                {ocrResult.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50 transition-colors hover:bg-cream/50">
                    <td className="px-4 py-3 font-medium text-dark">{item.name}</td>
                    <td className={`px-4 py-3 font-medium ${item.isAbnormal ? 'text-red-500' : 'text-mint'}`}>{item.value}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-gray-500">{item.referenceRange}</td>
                    <td className="px-4 py-3">
                      {item.isAbnormal ? (
                        <span className="flex items-center gap-1 text-red-500"><AlertCircle className="h-4 w-4" />异常</span>
                      ) : (
                        <span className="flex items-center gap-1 text-mint"><CheckCircle2 className="h-4 w-4" />正常</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interpretations */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-dark">结果解读</h3>
            {ocrResult.map((item, i) => (
              <div key={i} className={`rounded-xl p-4 ${item.isAbnormal ? 'bg-red-50 border border-red-100' : 'bg-mint-light/20 border border-mint-light/40'}`}>
                <div className="flex items-center gap-2">
                  {item.isAbnormal ? <AlertCircle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-mint" />}
                  <span className={`text-sm font-medium ${item.isAbnormal ? 'text-red-600' : 'text-mint'}`}>{item.name}: {item.value} {item.unit}</span>
                </div>
                <p className="mt-1.5 text-sm text-gray-600">{item.interpretation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Reports */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-dark">历史报告</h3>
        {mockHistory.length > 0 ? (
          <div className="space-y-3">
            {mockHistory.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10">
                  <FileText className="h-6 w-6 text-coral" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{r.reportType}</p>
                  <p className="text-xs text-gray-400">孕{r.pregnancyWeek}周 · {new Date(r.parsedAt).toLocaleDateString('zh-CN')}</p>
                </div>
                <button className="rounded-xl bg-coral-light/20 px-3 py-1.5 text-xs font-medium text-coral hover:bg-coral-light/40">
                  查看详情
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400">暂无历史报告</p>
        )}
      </div>
    </div>
  );
}
