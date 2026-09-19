import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  RefreshCw,
  Users
} from 'lucide-react';
import api from '../../services/api';

export default function BulkImportWizard() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Validate/Duplicates, 4: Execute & Done
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [validationReport, setValidationReport] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Handle File Selection & Upload Preview
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        setPreviewData(res.data);
        setColumnMapping(res.data.suggestedMapping || {});
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to read spreadsheet file');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate Column Mapping & Detect Duplicates
  const handleValidateDuplicates = async () => {
    if (!columnMapping.businessName || !columnMapping.phone) {
      setErrorMsg('Please map both Business Name and Phone Number columns.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));

      const res = await api.post('/import/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        setValidationReport(res.data);
        setStep(3);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Execute Batch Import
  const handleExecuteImport = async (skipDuplicates = true) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('options', JSON.stringify({ skipDuplicates, priority: 'MEDIUM' }));

      const res = await api.post('/import/execute', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.success) {
        setImportResult(res.data);
        setStep(4);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Batch import failed');
    } finally {
      setLoading(false);
    }
  };

  // Download Duplicates CSV
  const handleDownloadDuplicates = () => {
    if (!importResult?.duplicateRows?.length) return;
    const rows = [['Row Number', 'Reason']];
    importResult.duplicateRows.forEach((r) => rows.push([r.row, `"${r.reason}"`]));
    const csv = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skipped_duplicates_report.csv';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Bulk Excel & CSV Data Import
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          High-performance batch importer with automatic phone normalization and multi-tier duplicate prevention
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        {[
          { num: 1, title: 'Upload File' },
          { num: 2, title: 'Column Mapping' },
          { num: 3, title: 'Duplicate Check' },
          { num: 4, title: 'Done' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step >= s.num ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Upload File */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="max-w-md mx-auto p-8 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl transition bg-slate-50/50 flex flex-col items-center justify-center">
            <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="font-bold text-sm text-slate-800">Choose Excel or CSV File</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Supports .xlsx, .xls, .csv up to 50MB</p>

            <label className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition shadow-xs">
              <span>{loading ? 'Reading File...' : 'Select Spreadsheet'}</span>
              <input
                type="file"
                disabled={loading}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && previewData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Map Columns to CRM Fields</h3>
              <p className="text-xs text-slate-400">
                Found {previewData.totalRows} rows in file. Verify column alignments below.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { field: 'businessName', label: 'Business / Company Name *', required: true },
              { field: 'phone', label: 'Primary Phone / Mobile *', required: true },
              { field: 'ownerName', label: 'Contact Person / Owner' },
              { field: 'alternatePhone', label: 'Alternate Phone' },
              { field: 'email', label: 'Email Address' },
              { field: 'category', label: 'Category' },
              { field: 'city', label: 'City' },
              { field: 'district', label: 'District' },
              { field: 'state', label: 'State' },
              { field: 'address', label: 'Address' },
              { field: 'pincode', label: 'Pincode' }
            ].map(({ field, label, required }) => (
              <div key={field} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1.5">{label}</label>
                <select
                  value={columnMapping[field] || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-amber-500 font-medium"
                >
                  <option value="">-- Do Not Map --</option>
                  {previewData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleValidateDuplicates}
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
            >
              <span>{loading ? 'Analyzing Data...' : 'Check Duplicates & Preview'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Duplicate Check & Validation Results */}
      {step === 3 && validationReport && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Validation & Duplicate Report</h3>
            <p className="text-xs text-slate-400">
              Examined {validationReport.total} records against existing CRM database records
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-700">
                {validationReport.validCount}
              </div>
              <div className="text-xs font-semibold text-emerald-800 mt-1">New Unique Leads</div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="text-2xl font-bold text-amber-700">
                {validationReport.duplicateCount}
              </div>
              <div className="text-xs font-semibold text-amber-800 mt-1">
                Duplicates (DB / File)
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
              <div className="text-2xl font-bold text-rose-700">
                {validationReport.invalidCount}
              </div>
              <div className="text-xs font-semibold text-rose-800 mt-1">Invalid (Missing Info)</div>
            </div>
          </div>

          {/* Duplicate Samples Preview */}
          {validationReport.sampleDuplicates?.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Detected Duplicates Sample</span>
              </h4>
              <div className="divide-y divide-slate-200">
                {validationReport.sampleDuplicates.slice(0, 5).map((d, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">
                        {d.data?.businessName || 'Record'}
                      </span>{' '}
                      <span className="text-slate-500 font-mono">({d.data?.phone})</span>
                    </div>
                    <span className="text-amber-800 font-medium">{d.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExecuteImport(true)}
                disabled={loading || validationReport.validCount === 0}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
              >
                <span>
                  {loading
                    ? 'Importing in chunks...'
                    : `Import ${validationReport.validCount} Unique Leads (Skip Duplicates)`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Final Import Result */}
      {step === 4 && importResult && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Batch Import Complete!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Successfully inserted {importResult.successful} new leads into Yellow Pages CRM
            </p>
          </div>

          <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-400">Total Rows</div>
              <div className="text-lg font-bold text-slate-800">{importResult.totalRows}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-slate-400">Duplicates Skipped</div>
              <div className="text-lg font-bold text-amber-600">{importResult.duplicates}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            {importResult.duplicates > 0 && (
              <button
                onClick={handleDownloadDuplicates}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Skipped Records</span>
              </button>
            )}

            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setPreviewData(null);
                setValidationReport(null);
                setImportResult(null);
              }}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
