import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../api";
import Layout from '../components/Layout.jsx';
import DocumentCard from '../components/DocumentCard.jsx';
import Modal from '../components/Modal.jsx';
import Toast from '../components/Toast.jsx';
import DocumentList from '../components/DocumentList.jsx';

// Helper to get status color
const getStatusBadgeClass = (action) => {
  switch (action?.toUpperCase()) {
    case 'VERIFIED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 ring-red-600/20';
    case 'PENDING':
      return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-500/10';
  }
};


export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalLogs, setModalLogs] = useState([]);
  const [modalDocName, setModalDocName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log('Making API calls with token:', token ? 'exists' : 'none');
      console.log('localStorage token:', localStorage.getItem('token') ? 'exists' : 'none');
      
      // Test the API calls individually to see which one fails
      try {
        console.log('Testing vendor profile API call...');
        const profileRes = await api.getVendorProfile();
        console.log('Profile API call successful:', profileRes.data);
        setProfile(profileRes.data.data.vendor);
      } catch (profileError) {
        console.error('Profile API call failed:', profileError);
        throw profileError;
      }

      try {
        console.log('Testing vendor documents API call...');
        const documentsRes = await api.getVendorDocuments();
        console.log('Documents API call successful:', documentsRes.data);
        
        // Process documents to add categories
        const docs = documentsRes.data.documents || [];
        const processedDocs = docs.map(doc => {
          let category = 'Other';
          const name = doc.name.toLowerCase();
          
          if (name.includes('epf')) category = 'EPF';
          else if (name.includes('esic')) category = 'ESIC';
          else if (name.includes('factory')) category = 'Factory';
          else if (name.includes('tnpcb')) category = 'TNPCB';
          else if (name.includes('hazardous')) category = 'Hazardous';
          else if (name.includes('fire')) category = 'Fire';
          else if (name.includes('iso')) category = 'ISO';
          else if (name.includes('gots')) category = 'GOTS';
          else if (name.includes('oeko-tex')) category = 'OEKO-TEX';
          
          return { ...doc, category };
        });
        
        setDocuments(processedDocs);
      } catch (documentsError) {
        console.error('Documents API call failed:', documentsError);
        throw documentsError;
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.error || `Failed to load data: ${err.message}`);
      showToast('error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for authentication to be ready
    if (!isAuthenticated || !token) {
      console.log('Waiting for authentication...');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('token exists:', !!token);
      console.log('localStorage token:', localStorage.getItem('token') ? 'exists' : 'none');
      return;
    }

    fetchData();
  }, [isAuthenticated, token]);

  // Polling effect for status updates after upload
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const documentsRes = await api.getVendorDocuments();
        const docs = documentsRes.data.documents || [];
        const processedDocs = processDocuments(docs);
        setDocuments(processedDocs);
        
        // Check if any documents are still pending
        const hasPendingDocs = processedDocs.some(doc => 
          doc.uploadedDocuments?.some(uploadedDoc => 
            uploadedDoc.verificationStatus === 'PENDING' || 
            uploadedDoc.verificationStatus === 'PENDING_MANUAL_REVIEW'
          )
        );
        
        // Stop polling if no more pending documents
        if (!hasPendingDocs) {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling document status:", error);
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isPolling]);

  const processDocuments = (docs) => {
    return (docs || []).map(doc => {
      let category = 'Other';
      const name = doc.name.toLowerCase();
      
      if (name.includes('epf')) category = 'EPF';
      else if (name.includes('esic')) category = 'ESIC';
      else if (name.includes('factory')) category = 'Factory';
      else if (name.includes('tnpcb')) category = 'TNPCB';
      else if (name.includes('hazardous')) category = 'Hazardous';
      else if (name.includes('fire')) category = 'Fire';
      else if (name.includes('iso')) category = 'ISO';
      else if (name.includes('gots')) category = 'GOTS';
      else if (name.includes('oeko-tex')) category = 'OEKO-TEX';
      
      return { ...doc, category };
    });
  };

  const handleFileChange = async (e, complianceDocumentId) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      setUploadingId(complianceDocumentId);
      setUploadStatus((s) => ({ ...s, [complianceDocumentId]: "Uploading..." }));

      const formData = new FormData();
      formData.append("document", file);
      formData.append("complianceDocumentId", complianceDocumentId);

      await api.uploadDocument(formData);
      
      // Refresh documents list
      const documentsRes = await api.getVendorDocuments();
      const processedDocs = processDocuments(documentsRes.data.documents);
      setDocuments(processedDocs);
      
      setUploadStatus((s) => ({
        ...s,
        [complianceDocumentId]: "Upload successful!"
      }));
      showToast('success', 'Document uploaded successfully');
      
      // Start polling for status updates
      setIsPolling(true);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err?.response?.data?.error || "Upload failed";
      setUploadStatus((s) => ({
        ...s,
        [complianceDocumentId]: errorMessage
      }));
      showToast('error', errorMessage);
    } finally {
      setUploadingId(null);
    }
  };

  const handleShowLogs = (doc) => {
    if (!doc) return;

    const allLogs = (doc.uploadedDocuments || [])
      .flatMap(uploadedDoc => {
        const historyEntries = (uploadedDoc.history && uploadedDoc.history.length > 0)
          ? uploadedDoc.history
          : [{
              action: uploadedDoc.verificationStatus || 'PENDING',
              timestamp: uploadedDoc.uploadedAt || new Date().toISOString(),
              details: uploadedDoc.verificationSummary || 'Document verification status',
              changedByUserId: 'SYSTEM',
            }];
        
        return [
          ...historyEntries,
          {
            action: 'UPLOADED',
            timestamp: uploadedDoc.uploadedAt,
            details: `New document version uploaded.`,
            changedByUserId: 'SYSTEM'
          }
        ];
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setModalLogs(allLogs);
    setModalDocName(doc.name);
    setIsModalOpen(true);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  function safeDisplay(val) {
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (val && typeof val === 'object') return JSON.stringify(val);
    return 'SYSTEM';
  }

  return (
    <Layout>
              <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Audit Logs for ${modalDocName}`}
        >
          {!modalLogs || modalLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No audit logs found</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {modalLogs.map((log, idx) => {
                const displayName = safeDisplay(log.changedByUser?.name || log.changedByUserId);
                console.log('Audit log displayName:', displayName, log.changedByUser, log.changedByUserId);
                return (
                  <li key={idx} className="bg-gray-50 rounded-lg p-4 transition-all hover:bg-gray-100">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                      <time className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{log.details}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <img
                        className="h-4 w-4 rounded-full"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`}
                        alt=""
                      />
                      <span>{displayName}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Modal>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Compliance Documents</h1>
            <p className="mt-1 text-sm sm:text-base text-text-secondary">
              Upload and manage your compliance documents
            </p>
          </div>
          <div className="text-text-tertiary text-xs sm:text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-status-error-bg border border-status-error-border rounded-lg text-status-error-text">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.66669V10" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
                <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
                <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.67"/>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner w-8 h-8" />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
              <p className="text-gray-500">Loading authentication...</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto">
            <DocumentList
              documents={documents}
              uploadingId={uploadingId}
              disableUpload={false}
              onUpload={handleFileChange}
              onViewHistory={handleShowLogs}
              uploadStatus={uploadStatus}
            />
          </div>
        )}

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Layout>
  );
} 