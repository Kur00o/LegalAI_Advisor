import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle, Loader2, Download, Trash2, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { documentAnalysisService, DocumentAnalysisResult, BatchAnalysisResult } from '../services/documentAnalysis';
import { ReportExportService } from '../services/reportExport';

interface DocumentAnalysisPageProps {
  onBack: () => void;
  country: string;
}

// Salcosta-inspired animated background component
function SalcostaBackground() {
  return (
    <div className="salcosta-background">
      {/* Animated gradient orbs */}
      <div className="floating-orb orb-1"></div>
      <div className="floating-orb orb-2"></div>
      <div className="floating-orb orb-3"></div>
      <div className="floating-orb orb-4"></div>
      <div className="floating-orb orb-5"></div>
      <div className="floating-orb orb-6"></div>
      
      {/* Animated grid overlay */}
      <div className="grid-overlay"></div>
      
      {/* Floating particles */}
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
    </div>
  );
}

export function DocumentAnalysisPage({ onBack, country }: DocumentAnalysisPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const status = await documentAnalysisService.getConfigurationStatus();
      setConfigStatus(status);
    } catch (error) {
      console.error('Error checking configuration:', error);
      setConfigStatus({
        configured: false,
        message: 'Failed to check document analysis configuration'
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(validateFile);
      if (validFiles.length > 0) {
        setUploadedFiles(validFiles);
        setError(null);
        if (validFiles.length === 1) {
          previewDocument(validFiles[0]);
        }
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(validateFile);
      if (validFiles.length > 0) {
        setUploadedFiles(validFiles);
        setError(null);
        if (validFiles.length === 1) {
          previewDocument(validFiles[0]);
        }
      }
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = [
      'text/plain', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.type === 'application/pdf') {
      setError('PDF files are currently not supported. Please convert to DOC, DOCX, or TXT format for analysis.');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload TXT, DOC, or DOCX files only. PDF support is temporarily unavailable.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB.');
      return false;
    }

    return true;
  };

  const previewDocument = async (file: File) => {
    try {
      const content = await documentAnalysisService.extractTextFromFile(file);
      setDocumentContent(content);
    } catch (err: any) {
      setError(err.message);
      setDocumentContent('');
    }
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;

    if (!configStatus?.configured) {
      setError('Document analysis is not configured. Please check your AI provider API keys in the environment variables.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setBatchResult(null);

    try {
      if (uploadedFiles.length === 1) {
        // Single file analysis
        const file = uploadedFiles[0];
        const content = await documentAnalysisService.extractTextFromFile(file);
        
        // Truncate content if too long
        const truncatedContent = content.length > 12000 ? content.substring(0, 12000) + '...' : content;
        
        const request = {
          content: truncatedContent,
          jurisdiction: country,
          analysisType: 'comprehensive' as const,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        };

        const result = await documentAnalysisService.analyzeDocument(request);
        setAnalysisResult(result);
      } else {
        // Batch analysis
        const result = await documentAnalysisService.batchAnalyzeDocuments(uploadedFiles, country);
        setBatchResult(result);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysisResult) return;
    
    try {
      await ReportExportService.exportToPDF(analysisResult);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export PDF. Please try again.');
    }
  };

  const handleExportJSON = async () => {
    if (!analysisResult) return;
    
    try {
      await ReportExportService.exportToJSON(analysisResult);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export JSON. Please try again.');
    }
  };

  const handleExportHTML = async () => {
    if (!analysisResult) return;
    
    try {
      await ReportExportService.exportToHTML(analysisResult);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export HTML. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (newFiles.length === 0) {
      setDocumentContent('');
    } else if (newFiles.length === 1) {
      previewDocument(newFiles[0]);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald border-emerald/20 bg-emerald/10';
      case 'MEDIUM': return 'text-deep-bronze border-deep-bronze/20 bg-deep-bronze/10';
      case 'HIGH': return 'text-legal-red border-legal-red/20 bg-legal-red/10';
      case 'CRITICAL': return 'text-legal-red border-legal-red/20 bg-legal-red/20';
      default: return 'text-cool-gray border-cool-gray/20 bg-cool-gray/10';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-sapphire-blue border-sapphire-blue/20 bg-sapphire-blue/10';
      case 'warning': return 'text-deep-bronze border-deep-bronze/20 bg-deep-bronze/10';
      case 'critical': return 'text-legal-red border-legal-red/20 bg-legal-red/10';
      default: return 'text-cool-gray border-cool-gray/20 bg-cool-gray/10';
    }
  };

  const configuredProviders = configStatus?.availableProviders?.filter((p: any) => p.configured).length || 0;
  const availableProviders = configStatus?.availableProviders?.filter((p: any) => p.available).length || 0;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <SalcostaBackground />
      
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 content-layer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors text-enhanced-contrast"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Main</span>
              </button>
              <div className="h-6 w-px bg-white/30" />
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100/20 p-2 rounded-lg backdrop-blur-sm">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white text-enhanced-contrast">Document Analysis</h1>
                  <p className="text-sm text-gray-300 text-enhanced-contrast">AI-powered legal document review</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={checkConfiguration}
                className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors text-enhanced-contrast"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">Refresh</span>
              </button>
              <div className="text-sm text-gray-300 text-enhanced-contrast">
                Jurisdiction: {country}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 content-layer">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 text-enhanced-contrast">Upload Legal Documents</h2>
            
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm text-enhanced-contrast">{error}</p>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors backdrop-blur-sm ${
                dragActive ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/20 bg-white/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white mb-2 text-enhanced-contrast">
                {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Drop your legal documents here'}
              </p>
              <p className="text-sm text-gray-400 mb-4 text-enhanced-contrast">
                Supports TXT, DOC, DOCX formats up to 10MB
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.doc,.docx"
                multiple
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer font-medium"
              >
                Choose Files
              </label>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-white mb-3 text-enhanced-contrast">Selected Files</h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-medium text-blue-200 text-enhanced-contrast">{file.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Document Preview for single file */}
                {uploadedFiles.length === 1 && documentContent && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white text-enhanced-contrast">Document Preview</h4>
                      <button
                        onClick={() => setShowDocumentPreview(!showDocumentPreview)}
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {showDocumentPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="text-sm">{showDocumentPreview ? 'Hide' : 'Show'} Preview</span>
                      </button>
                    </div>

                    {showDocumentPreview && (
                      <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur-sm">
                        <div className="text-sm text-gray-300 whitespace-pre-wrap text-enhanced-contrast">
                          {documentContent.substring(0, 2000) + (documentContent.length > 2000 ? '...' : '')}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || !configStatus?.configured}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        <span>Analyze Document{uploadedFiles.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white text-enhanced-contrast">Analysis Results</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportPDF}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={handleExportHTML}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>HTML</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Risk Assessment</h3>
                <div className={`p-4 rounded-lg border ${getRiskColor(analysisResult.riskAssessment.level)} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Risk Level: {analysisResult.riskAssessment.level}</span>
                    <span className="font-bold">Score: {analysisResult.riskAssessment.score}/10</span>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.riskAssessment.serviceProviderRisks && analysisResult.riskAssessment.serviceProviderRisks.length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Service Provider Risks:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {analysisResult.riskAssessment.serviceProviderRisks.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysisResult.riskAssessment.clientRisks && analysisResult.riskAssessment.clientRisks.length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Client Risks:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {analysisResult.riskAssessment.clientRisks.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(!analysisResult.riskAssessment.serviceProviderRisks && !analysisResult.riskAssessment.clientRisks && analysisResult.riskAssessment.factors) && (
                      <div>
                        <p className="font-medium text-sm">Risk Factors:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {analysisResult.riskAssessment.factors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Executive Summary</h3>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-gray-300 text-enhanced-contrast">{analysisResult.summary}</p>
                </div>
              </div>

              {/* Key Findings */}
              {analysisResult.keyFindings && analysisResult.keyFindings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Key Findings</h3>
                  <div className="space-y-3">
                    {analysisResult.keyFindings.map((finding, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(finding.severity)} backdrop-blur-sm`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{finding.category}</h4>
                            <p className="text-sm mb-2">{finding.finding}</p>
                            {finding.impact && (
                              <p className="text-xs opacity-80">Impact: {finding.impact}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-white/20">
                              {finding.severity.toUpperCase()}
                            </span>
                            {finding.affectedParty && (
                              <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                                {finding.affectedParty.replace('_', ' ').toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Recommendations</h3>
                  <div className="bg-emerald/10 border border-emerald/20 rounded-lg p-4 backdrop-blur-sm">
                    {Array.isArray(analysisResult.recommendations) ? (
                      typeof analysisResult.recommendations[0] === 'string' ? (
                        <ol className="text-emerald/90 space-y-2">
                          {analysisResult.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">{index + 1}. {rec}</li>
                          ))}
                        </ol>
                      ) : (
                        <div className="space-y-3">
                          {analysisResult.recommendations.map((rec: any, index) => (
                            <div key={index} className="border-l-2 border-emerald/30 pl-3">
                              <h4 className="font-medium text-emerald text-sm">{rec.category || 'Recommendation'}</h4>
                              <p className="text-emerald/90 text-sm">{rec.recommendation}</p>
                              {rec.implementation && (
                                <p className="text-emerald/70 text-xs mt-1">Implementation: {rec.implementation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="text-emerald/90 text-sm">{analysisResult.recommendations}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Legal Citations */}
              {analysisResult.legalCitations && analysisResult.legalCitations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Legal Citations</h3>
                  <div className="bg-sapphire-blue/10 border border-sapphire-blue/20 rounded-lg p-4 backdrop-blur-sm">
                    <ul className="text-sapphire-blue/90 space-y-1">
                      {analysisResult.legalCitations.map((citation, index) => (
                        <li key={index} className="text-sm">• {citation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch Results */}
          {batchResult && (
            <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white mb-4 text-enhanced-contrast">Batch Analysis Results</h2>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Progress: {batchResult.completedFiles}/{batchResult.totalFiles} files</span>
                  <span>Status: {batchResult.status}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchResult.completedFiles / batchResult.totalFiles) * 100}%` }}
                  ></div>
                </div>
              </div>

              {batchResult.errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-red-400 mb-2">Errors:</h3>
                  <div className="space-y-1">
                    {batchResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-300 bg-red-500/10 p-2 rounded">{error}</p>
                    ))}
                  </div>
                </div>
              )}

              {batchResult.results.length > 0 && (
                <div>
                  <h3 className="font-medium text-white mb-3">Completed Analyses:</h3>
                  <div className="space-y-3">
                    {batchResult.results.map((result, index) => (
                      <div key={index} className="bg-white/5 border border-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{result.documentInfo.fileName}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getRiskColor(result.riskAssessment.level)}`}>
                            {result.riskAssessment.level}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{result.summary.substring(0, 200)}...</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Risk Score: {result.riskAssessment.score}/10</span>
                          <span>{result.keyFindings?.length || 0} findings</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}