import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Shield, AlertTriangle, CheckCircle, Loader2, Download, Trash2, Eye, EyeOff, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { redactionAnalysisService, RedactionAnalysisResult } from '../services/redactionAnalysis';

interface RedactionReviewPageProps {
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

export function RedactionReviewPage({ onBack, country }: RedactionReviewPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RedactionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const status = await redactionAnalysisService.getConfigurationStatus();
      setConfigStatus(status);
    } catch (error) {
      console.error('Error checking configuration:', error);
      setConfigStatus({
        configured: false,
        message: 'Failed to check redaction analysis configuration'
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setError(null);
        previewDocument(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setUploadedFile(file);
        setError(null);
        previewDocument(file);
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
      const content = await redactionAnalysisService.extractTextFromFile(file);
      setDocumentContent(content);
    } catch (err: any) {
      setError(err.message);
      setDocumentContent('');
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !documentContent) return;

    if (!configStatus?.configured) {
      setError('Redaction analysis is not configured. Please check your AI provider API keys in the environment variables.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const request = {
        content: documentContent,
        jurisdiction: country,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type
      };

      const result = await redactionAnalysisService.analyzeRedactedDocument(request);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Redaction analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald border-emerald/30 bg-emerald/20';
      case 'MEDIUM': return 'text-deep-bronze border-deep-bronze/30 bg-deep-bronze/20';
      case 'HIGH': return 'text-legal-red border-legal-red/30 bg-legal-red/20';
      case 'CRITICAL': return 'text-legal-red border-legal-red/30 bg-legal-red/30';
      default: return 'text-cool-gray border-cool-gray/30 bg-cool-gray/20';
    }
  };

  const getRedactionTypeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-emerald border-emerald/30 bg-emerald/20';
      case 'MEDIUM': return 'text-deep-bronze border-deep-bronze/30 bg-deep-bronze/20';
      case 'HIGH': return 'text-legal-red border-legal-red/30 bg-legal-red/20';
      case 'CRITICAL': return 'text-legal-red border-legal-red/30 bg-legal-red/30';
      default: return 'text-cool-gray border-cool-gray/30 bg-cool-gray/20';
    }
  };

  const configuredProviders = configStatus?.availableProviders?.filter((p: any) => p.configured).length || 0;

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
                <div className="bg-orange-100/20 p-2 rounded-lg backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white text-enhanced-contrast">Redaction Review</h1>
                  <p className="text-sm text-gray-300 text-enhanced-contrast">Analyze redacted documents</p>
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

      {/* Feature Banner */}
      <div className="bg-orange-500/10 backdrop-blur-sm border-b border-orange-200/20 px-4 py-3 content-layer">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-orange-200 text-enhanced-contrast">Redaction Review: Analyze Partially Hidden Documents</h3>
              <p className="text-sm text-orange-300 mt-1 text-enhanced-contrast">
                Upload documents with redacted content to assess the impact of missing information on legal enforceability and risk exposure.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 content-layer">
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl shadow-sm border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 text-enhanced-contrast">Upload Redacted Document</h2>
            
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm text-enhanced-contrast">{error}</p>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors backdrop-blur-sm ${
                dragActive ? 'border-orange-400/50 bg-orange-500/10' : 'border-white/20 bg-white/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white mb-2 text-enhanced-contrast">
                {uploadedFile ? uploadedFile.name : 'Drop your redacted document here'}
              </p>
              <p className="text-sm text-gray-400 mb-4 text-enhanced-contrast">
                Supports TXT, DOC, DOCX formats up to 10MB
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt,.doc,.docx"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer font-medium"
              >
                Choose File
              </label>
            </div>

            {/* Document Preview */}
            {uploadedFile && documentContent && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white text-enhanced-contrast">Document Preview</h3>
                  <button
                    onClick={() => setShowDocumentPreview(!showDocumentPreview)}
                    className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {showDocumentPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-sm">{showDocumentPreview ? 'Hide' : 'Show'} Preview</span>
                  </button>
                </div>

                {showDocumentPreview && (
                  <div className="bg-white/10 border border-white/30 rounded-lg p-4 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur-sm">
                    <div className="text-sm text-white/90 whitespace-pre-wrap text-enhanced-contrast">
                      {documentContent.substring(0, 2000) + (documentContent.length > 2000 ? '...' : '')}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg mt-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="font-medium text-orange-200 text-enhanced-contrast">{uploadedFile.name}</p>
                      <p className="text-sm text-orange-300 text-enhanced-contrast">
                        Ready for redaction analysis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setDocumentContent('');
                    }}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || !configStatus?.configured}
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Analyzing Redactions...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        <span>Analyze Redacted Document</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-sm border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 text-enhanced-contrast">Redaction Analysis Results</h2>

              {/* Redaction Detection Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Redaction Detection</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{analysisResult.redactionDetection.redactedSections}</div>
                      <div className="text-sm text-orange-300">Redacted Sections</div>
                    </div>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{analysisResult.redactionDetection.visibleContentPercentage}%</div>
                      <div className="text-sm text-blue-300">Visible Content</div>
                    </div>
                  </div>
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{analysisResult.redactionDetection.integrityCheck.consistencyScore}%</div>
                      <div className="text-sm text-purple-300">Integrity Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redaction Types */}
              {analysisResult.redactionDetection.redactionTypes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Redaction Types</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysisResult.redactionDetection.redactionTypes.map((type, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${getRedactionTypeColor(type.riskLevel)} backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium capitalize text-white/95">{type.type.replace('_', ' ')}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/30 text-white/95">
                            {type.count} found
                          </span>
                        </div>
                        <p className="text-sm mb-2 text-white/90">{type.description}</p>
                        <div className="flex items-center justify-between text-xs text-white/85">
                          <span>Risk: {type.riskLevel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Risk Assessment</h3>
                <div className={`p-4 rounded-lg border ${getRiskColor(analysisResult.riskAssessment.level)} backdrop-blur-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white/95">Risk Level: {analysisResult.riskAssessment.level}</span>
                    <span className="font-bold text-white/95">Score: {analysisResult.riskAssessment.score}/10</span>
                  </div>
                  <p className="text-sm mb-3 text-white/90">{analysisResult.riskAssessment.limitationNotice}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm text-white/90">Risk Factors:</p>
                      <ul className="text-sm list-disc list-inside space-y-1 text-white/85">
                        {analysisResult.riskAssessment.factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Granular Clause Impact */}
              {analysisResult.granularClauseImpact && analysisResult.granularClauseImpact.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Clause-Level Impact Analysis</h3>
                  <div className="space-y-4">
                    {analysisResult.granularClauseImpact.map((clause, index) => (
                      <div key={index} className="bg-white/10 border border-white/30 rounded-lg p-4 backdrop-blur-sm">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-white/95">{clause.clauseType}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getRiskColor(clause.enforceabilityImpact.level)}`}>
                            {clause.enforceabilityImpact.level} Impact
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-white/90">Visible Content:</span>
                            <p className="text-white/85">{clause.visibleContent}</p>
                          </div>
                          {clause.redactedElements.length > 0 && (
                            <div>
                              <span className="font-medium text-white/90">Redacted Elements:</span>
                              <ul className="text-white/85 list-disc list-inside">
                                {clause.redactedElements.map((element, idx) => (
                                  <li key={idx}>{element}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-white/90">Enforceability Impact:</span>
                            <p className="text-white/85">{clause.enforceabilityImpact.description}</p>
                          </div>
                          {clause.recommendations.length > 0 && (
                            <div>
                              <span className="font-medium text-white/90">Recommendations:</span>
                              <ul className="text-white/85 list-disc list-inside">
                                {clause.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Impact Assessment */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Impact Assessment</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-red-400 mb-2">Critical Gaps</h4>
                    <ul className="text-sm text-red-300 space-y-1">
                      {analysisResult.impactAssessment.criticalGaps.map((gap, index) => (
                        <li key={index}>• {gap}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                    <h4 className="font-medium text-orange-400 mb-2">Legal Exposure</h4>
                    <ul className="text-sm text-orange-300 space-y-1">
                      {analysisResult.impactAssessment.legalExposure.map((exposure, index) => (
                        <li key={index}>• {exposure}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Recommendations</h3>
                <div className="bg-emerald/20 border border-emerald/30 rounded-lg p-4 backdrop-blur-sm">
                  <ol className="text-emerald/95 space-y-2">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm">{index + 1}. {rec}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 text-enhanced-contrast">Next Steps</h3>
                <div className="bg-sapphire-blue/20 border border-sapphire-blue/30 rounded-lg p-4 backdrop-blur-sm">
                  <ol className="text-sapphire-blue/95 space-y-2">
                    {analysisResult.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm">{index + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}