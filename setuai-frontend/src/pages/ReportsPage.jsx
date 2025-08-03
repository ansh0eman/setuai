// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import ComplianceRadialChart from '../components/charts/ComplianceRadialChart.jsx';
import * as api from '../api/index.js';

const getStatusColor = (status) => {
  switch (status) {
    case 'VERIFIED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
    case 'PENDING_MANUAL_REVIEW':
      return 'bg-yellow-100 text-yellow-800';
    case 'MISSING':
        return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewModal, setPreviewModal] = useState({ isOpen: false, document: null });

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.getVendorReport();
      if (response.data.success) {
        console.log('Reports data fetched:', response.data.data);
        setReportData(response.data.data);
      } else {
        setError('Failed to fetch report data.');
      }
    } catch (err) {
      setError('An error occurred while fetching the report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handlePreview = (document) => {
    if (document.filePath) {
      setPreviewModal({
        isOpen: true,
        document: document
      });
    }
  };

  const closePreview = () => {
    setPreviewModal({ isOpen: false, document: null });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500 text-center py-10">{error}</div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="text-center py-10">No report data available.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Compliance Report</h1>
        
        <ComplianceRadialChart 
          documents={reportData.documents} 
          overallScore={reportData.overallScore} 
        />

        <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Document Details</h3>
          <ul className="flex flex-col">
            <li className="py-3 px-4 text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg grid grid-cols-4 items-center gap-x-2">
              <span className="text-center">Preview</span>
              <span className="text-center">Document Name</span>
              <span className="text-center">Status</span>
              <span className="text-center">Compliance Score</span>
            </li>
            {reportData.documents.map(doc => (
              <li key={doc.id} className="py-3 px-4 text-sm border border-gray-200 text-gray-800 -mt-px first:rounded-t-lg first:mt-0 last:rounded-b-lg grid grid-cols-4 items-center gap-x-2">
                <div className="flex justify-center">
                  {doc.filePath ? (
                    <button
                      onClick={() => handlePreview(doc)}
                      className="h-10 w-10 bg-blue-100 hover:bg-blue-200 rounded-md flex items-center justify-center text-blue-600 transition-colors"
                      title="Preview Document"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m5 5l-4-4" /></svg>
                    </div>
                  )}
                </div>
                <span className="text-center">{doc.complianceDocument.name}</span>
                <div className="flex justify-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.verificationStatus)}`}>
                    {doc.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-900">
                    {Math.round(doc.riskScore || 0)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Preview Modal */}
        {previewModal.isOpen && previewModal.document && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title" 
            role="dialog" 
            aria-modal="true"
          >
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/30 transition-opacity backdrop-blur-[2px]"
              onClick={closePreview}
            ></div>

            {/* Modal Panel */}
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white/95 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 
                        className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent"
                        id="modal-title"
                      >
                        Preview: {previewModal.document.complianceDocument.name}
                      </h3>
                      <button
                        onClick={closePreview}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    <img
                      src={`http://localhost:3001${previewModal.document.filePath}`}
                      alt={previewModal.document.complianceDocument.name}
                      className="w-full h-auto"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l-1-1m5 5l-4-4" />
                      </svg>
                      <p>Preview not available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}