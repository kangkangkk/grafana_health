import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, FileText, AlertCircle, CheckCircle2, ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import type { OcrItem } from '@/types';
import { takePhoto, pickImage } from '@/plugins/camera';
import { isNative } from '@/plugins/health';
import { useStore } from '@/store/useStore';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Report() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [week, setWeek] = useState(20);
  const [weekOpen, setWeekOpen] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadReport, reports, fetchReports, loading } = useStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const validateAndSetFile = (f: File | undefined) => {
    if (!f) return;
    setUploadError(null);

    // 文件大小校验
    if (f.size > MAX_FILE_SIZE) {
      setUploadError('文件大小不能超过 10MB');
      return;
    }
    // 文件类型校验
    if (!f.type.startsWith('image/')) {
      setUploadError('仅支持图片文件（JPG、PNG 等）');
      return;
    }

    setFile(f);
    setParsed(false);
    setOcrResult([]);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleNativeImage = (dataUrl: string) => {
    setUploadError(null);
    setPreview(dataUrl);
    setFile(null);
    setParsed(false);
    setOcrResult([]);
  };

  const handleTakePhoto = async () => {
    const result = await takePhoto();
    if (result) handleNativeImage(result);
  };

  const handlePickImage = async () => {
    const result = await pickImage();
    if (result) handleNativeImage(result);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const [uploadingState, setUploadingState] = useState(false);

  const handleUpload = async () => {
    if (!preview && !file) return;
    setUploadError(null);
    setUploadingState(true);
    try {
      const report = await uploadReport(file ?? preview!, week);
      setOcrResult(report.ocrResult ?? []);
      setParsed(true);
      setFile(null);
      setPreview(null);
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploadingState(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="font-display text-2xl font-bold text-dark">报告解析</h2>

      {/* Error Display */}
      {uploadError && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 p-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{uploadError}</p>
          <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
          onChange={(e) => validateAndSetFile(e.target.files?.[0])}
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
              <p className="mt-1 text-xs text-gray-400">支持 JPG、PNG 格式，最大 10MB</p>
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
                <ImageIcon className="h-4 w-4" />
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
          disabled={(!file && !preview) || uploadingState || loading}
          className="ml-auto rounded-2xl bg-gradient-to-r from-coral to-coral-light px-6 py-2 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          {uploadingState || loading ? '解析中...' : '开始解析'}
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
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-coral/10">
                  <FileText className="h-6 w-6 text-coral" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark">{r.reportType}</p>
                  <p className="text-xs text-gray-400">孕{r.pregnancyWeek}周 · {new Date(r.parsedAt || r.createdAt).toLocaleDateString('zh-CN')}</p>
                </div>
                <button className="rounded-xl bg-coral-light/20 px-3 py-1.5 text-xs font-medium text-coral hover:bg-coral-light/40">
                  查看详情
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">暂无历史报告</p>
          </div>
        )}
      </div>
    </div>
  );
}
