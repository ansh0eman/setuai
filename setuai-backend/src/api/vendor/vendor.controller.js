// src/api/vendor/vendor.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        uploadedDocuments: {
          include: {
            complianceDocument: true,
            history: {
              include: {
                changedByUser: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: { timestamp: 'desc' },
              take: 5
            }
          },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const totalDocuments = vendor.uploadedDocuments.length;
    const verifiedDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'VERIFIED'
    ).length;
    const pendingDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'PENDING'
    ).length;
    const rejectedDocuments = vendor.uploadedDocuments.filter(
      doc => doc.verificationStatus === 'REJECTED'
    ).length;

    res.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          companyName: vendor.companyName,
          factoryLocation: vendor.factoryLocation,
          complianceStatus: vendor.complianceStatus,
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt
        },
        users: vendor.users,
        documents: vendor.uploadedDocuments,
        statistics: {
          totalDocuments,
          verifiedDocuments,
          pendingDocuments,
          rejectedDocuments,
          compliancePercentage: totalDocuments > 0 ? Math.round((verifiedDocuments / totalDocuments) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor profile'
    });
  }
};

export const updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { companyName, factoryLocation } = req.body;

    if (!companyName || !factoryLocation) {
      return res.status(400).json({
        success: false,
        error: 'Company name and factory location are required'
      });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        companyName,
        factoryLocation
      }
    });

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: {
        id: updatedVendor.id,
        companyName: updatedVendor.companyName,
        factoryLocation: updatedVendor.factoryLocation,
        complianceStatus: updatedVendor.complianceStatus,
        updatedAt: updatedVendor.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor profile'
    });
  }
};

export const getComplianceStatus = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const [complianceDocuments, uploadedDocuments] = await Promise.all([
      prisma.complianceDocument.findMany({
        orderBy: { pillar: 'asc' }
      }),
      prisma.uploadedDocument.findMany({
        where: { vendorId },
        include: {
          complianceDocument: true
        }
      })
    ]);

    const uploadedDocsMap = new Map();
    uploadedDocuments.forEach(doc => {
      uploadedDocsMap.set(doc.complianceDocumentId, doc);
    });

    const complianceStatus = complianceDocuments.map(complianceDoc => {
      const uploadedDoc = uploadedDocsMap.get(complianceDoc.id);
      return {
        complianceDocument: complianceDoc,
        uploadedDocument: uploadedDoc || null,
        status: uploadedDoc ? uploadedDoc.verificationStatus : 'MISSING',
        isUploaded: !!uploadedDoc
      };
    });

    const totalRequired = complianceStatus.length;
    const verified = complianceStatus.filter(item => item.status === 'VERIFIED').length;
    const pending = complianceStatus.filter(item => item.status === 'PENDING').length;
    const missing = complianceStatus.filter(item => item.status === 'MISSING').length;
    const rejected = complianceStatus.filter(item => item.status === 'REJECTED').length;

    let overallStatus = 'RED';
    if (verified === totalRequired) {
      overallStatus = 'GREEN';
    } else if (verified > 0 || pending > 0) {
      overallStatus = 'AMBER';
    }

    res.json({
      success: true,
      data: {
        complianceStatus,
        summary: {
          totalRequired,
          verified,
          pending,
          missing,
          rejected,
          overallStatus
        }
      }
    });
  } catch (error) {
    console.error('Error fetching compliance status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance status'
    });
  }
};

export const getVendorReport = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        overallComplianceScore: true,
        complianceStatus: true,
      }
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const allRequiredDocs = await prisma.complianceDocument.findMany();
    const vendorUploadedDocs = await prisma.uploadedDocument.findMany({
      where: { vendorId: vendorId },
    });

    const uploadedDocsMap = new Map(vendorUploadedDocs.map(doc => [doc.complianceDocumentId, doc]));

    const documentsForReport = allRequiredDocs.map(reqDoc => {
      const uploadedDoc = uploadedDocsMap.get(reqDoc.id);
      return {
        id: uploadedDoc ? uploadedDoc.id : reqDoc.id,
        complianceDocument: {
          name: reqDoc.name,
          pillar: reqDoc.pillar,
        },
        verificationStatus: uploadedDoc ? uploadedDoc.verificationStatus : 'MISSING',
        riskScore: uploadedDoc ? uploadedDoc.riskScore : 0,
        filePath: uploadedDoc ? uploadedDoc.filePath : null,
      };
    });

    res.json({
      success: true,
      data: {
        overallScore: vendor.overallComplianceScore,
        complianceStatus: vendor.complianceStatus,
        documents: documentsForReport,
      }
    });

  } catch (error) {
    console.error('Error fetching vendor report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor report'
    });
  }
};
