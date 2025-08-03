// src/services/risk.scoring.service.js
import prisma from './database.service.js';
import { scoringWeights } from '../config/scoring.config.js';

/**
 * Calculates the history multiplier based on rejection count.
 * @param {string} documentId - The document ID to check history for.
 * @returns {Promise<number>} The multiplier value.
 */
const _calculateHistoryMultiplier = async (documentId) => {
  const rejectionCount = await prisma.auditLog.count({
    where: {
      documentId: documentId,
      action: 'REJECTED'
    }
  });
  return scoringWeights.historyMultiplier[rejectionCount] || 1.0;
};

/**
 * Calculates and updates the risk score for a single uploaded document.
 * @param {string} documentId - The ID of the uploaded document to score.
 * @returns {Promise<void>}
 */
export const calculateDocumentScore = async (documentId) => {
  const document = await prisma.uploadedDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    console.error(`Document with ID ${documentId} not found.`);
    return;
  }

  let baseScore = 0;
  if (document.verificationStatus === 'VERIFIED') {
    // Use the AI confidence score from verificationDetails if available
    const verificationDetails = document.verificationDetails || {};
    const confidenceScore = verificationDetails.confidenceScore || 0;
    console.log(`Document ${documentId} confidence score: ${confidenceScore}`);
    baseScore = confidenceScore * 100; // Convert confidence score to percentage
  } else {
    baseScore = scoringWeights.factors[document.verificationStatus] || 0;
  }

  const historyMultiplier = await _calculateHistoryMultiplier(documentId);
  const finalScore = baseScore * historyMultiplier;

  console.log(`Document ${documentId} scoring: baseScore=${baseScore}, historyMultiplier=${historyMultiplier}, finalScore=${finalScore}`);

  await prisma.uploadedDocument.update({
    where: { id: documentId },
    data: { riskScore: finalScore },
  });
};

/**
 * Calculates and updates the overall compliance score and status for a vendor.
 * @param {string} vendorId - The ID of the vendor to score.
 * @returns {Promise<void>}
 */
export const calculateVendorScore = async (vendorId) => {
  const allRequiredDocs = await prisma.complianceDocument.findMany();
  const vendorUploadedDocs = await prisma.uploadedDocument.findMany({
    where: { vendorId: vendorId },
  });

  const uploadedDocsMap = new Map(vendorUploadedDocs.map(doc => [doc.complianceDocumentId, doc]));

  if (allRequiredDocs.length === 0) {
    await prisma.vendor.update({
        where: { id: vendorId },
        data: { overallComplianceScore: 0, complianceStatus: 'RED' },
    });
    return;
  }

  let totalWeightedScore = 0;
  let totalPillarWeight = 0;

  for (const reqDoc of allRequiredDocs) {
    const pillarWeight = scoringWeights.pillars[reqDoc.pillar] || 1.0;
    let score = 0;

    const uploadedDoc = uploadedDocsMap.get(reqDoc.id);

    if (uploadedDoc) {
      // Document exists, use its score. If score is null, recalculate it.
      if (uploadedDoc.riskScore === null) {
        await calculateDocumentScore(uploadedDoc.id);
        const updatedDoc = await prisma.uploadedDocument.findUnique({ where: { id: uploadedDoc.id }});
        score = updatedDoc.riskScore || 0;
      } else {
        score = uploadedDoc.riskScore;
      }
    } else {
      // Document is missing
      score = scoringWeights.factors.MISSING;
    }
    
    totalWeightedScore += score * pillarWeight;
    totalPillarWeight += pillarWeight;
  }

  const finalVendorScore = totalPillarWeight > 0 ? 
    (totalWeightedScore / totalPillarWeight) * (vendorUploadedDocs.length / allRequiredDocs.length) : 0;
  
  console.log(`Vendor ${vendorId} scoring: totalWeightedScore=${totalWeightedScore}, totalPillarWeight=${totalPillarWeight}, finalVendorScore=${finalVendorScore}`);
  
  let status;
  if (finalVendorScore >= 85) {
    status = 'GREEN';
  } else if (finalVendorScore >= 60) {
    status = 'AMBER';
  } else {
    status = 'RED';
  }

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      overallComplianceScore: finalVendorScore,
      complianceStatus: status,
    },
  });
};