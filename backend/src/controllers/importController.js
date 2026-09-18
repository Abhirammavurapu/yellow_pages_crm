const xlsx = require('xlsx');
const Lead = require('../models/Lead');
const { success, error } = require('../utils/apiResponse');
const { normalizePhoneNumber } = require('../utils/phoneNormalizer');
const { batchCheckDuplicates } = require('../services/duplicateService');
const { logAudit } = require('../services/auditService');

/**
 * Safely parse JSON from multipart/form-data
 */
const parseJSON = (value, fallback = {}) => {
  if (!value) return fallback;

  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (err) {
    throw new Error('Invalid JSON data received');
  }
};

/**
 * Read uploaded Excel/CSV file
 */
const readUploadedFile = (file) => {
  if (!file || !file.buffer) {
    throw new Error('Invalid uploaded file');
  }

  const workbook = xlsx.read(file.buffer, {
    type: 'buffer',
    cellDates: true
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Workbook contains no sheets');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error('Unable to read worksheet');
  }

  const rawData = xlsx.utils.sheet_to_json(worksheet, {
    defval: ''
  });

  return {
    workbook,
    sheetName,
    worksheet,
    rawData
  };
};

/**
 * Convert spreadsheet row according to column mapping
 */
const mapRow = (row, columnMapping) => {
  const getValue = (field) => {
    if (!columnMapping[field]) return '';
    return String(row[columnMapping[field]] ?? '').trim();
  };

  return {
    businessName: getValue('businessName'),
    ownerName: getValue('ownerName'),
    phone: getValue('phone'),
    alternatePhone: getValue('alternatePhone'),
    email: getValue('email'),
    category: getValue('category') || 'General',
    city: getValue('city'),
    district: getValue('district'),
    state: getValue('state'),
    pincode: getValue('pincode'),
    address: getValue('address'),
    website: getValue('website')
  };
};

/**
 * Automatically suggest column mappings
 */
const createSuggestedMapping = (headers) => {
  const suggestedMapping = {};

  for (const header of headers) {
    const lower = String(header).toLowerCase().trim();

    if (
      (lower.includes('business') ||
        lower.includes('company') ||
        lower.includes('firm') ||
        (lower.includes('name') && !lower.includes('owner'))) &&
      !suggestedMapping.businessName
    ) {
      suggestedMapping.businessName = header;
    }

    if (
      lower.includes('owner') ||
      lower.includes('contact person') ||
      lower.includes('proprietor')
    ) {
      if (!suggestedMapping.ownerName) {
        suggestedMapping.ownerName = header;
      }
    }

    if (
      lower.includes('mobile') ||
      lower.includes('phone') ||
      lower.includes('contact') ||
      lower.includes('cell')
    ) {
      if (!suggestedMapping.phone) {
        suggestedMapping.phone = header;
      }
    }

    if (
      lower.includes('alt') &&
      (lower.includes('phone') || lower.includes('mobile'))
    ) {
      suggestedMapping.alternatePhone = header;
    }

    if (lower.includes('mail') && !suggestedMapping.email) {
      suggestedMapping.email = header;
    }

    if (lower.includes('category') && !suggestedMapping.category) {
      suggestedMapping.category = header;
    }

    if (lower.includes('city') && !suggestedMapping.city) {
      suggestedMapping.city = header;
    }

    if (lower.includes('district') && !suggestedMapping.district) {
      suggestedMapping.district = header;
    }

    if (lower.includes('state') && !suggestedMapping.state) {
      suggestedMapping.state = header;
    }

    if (
      (lower.includes('pin') || lower.includes('zip')) &&
      !suggestedMapping.pincode
    ) {
      suggestedMapping.pincode = header;
    }

    if (lower.includes('address') && !suggestedMapping.address) {
      suggestedMapping.address = header;
    }

    if (
      (lower.includes('website') || lower.includes('url')) &&
      !suggestedMapping.website
    ) {
      suggestedMapping.website = header;
    }
  }

  return suggestedMapping;
};

/**
 * Preview uploaded Excel/CSV
 */
const previewImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(
        res,
        'No file uploaded',
        'MISSING_FILE',
        400
      );
    }

    const { rawData } = readUploadedFile(req.file);

    if (rawData.length === 0) {
      return error(
        res,
        'The uploaded spreadsheet is empty',
        'EMPTY_DATA',
        400
      );
    }

    const headers = Object.keys(rawData[0]);

    const previewRows = rawData.slice(0, 10);

    const suggestedMapping =
      createSuggestedMapping(headers);

    return success(
      res,
      {
        totalRows: rawData.length,
        headers,
        previewRows,
        suggestedMapping
      },
      'File parsed successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Validate uploaded data
 * Performs duplicate checking without inserting anything
 */
const validateImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(
        res,
        'No file uploaded',
        'MISSING_FILE',
        400
      );
    }

    const columnMapping = parseJSON(
      req.body.columnMapping,
      {}
    );

    if (
      !columnMapping.businessName ||
      !columnMapping.phone
    ) {
      return error(
        res,
        'Business Name and Phone column mappings are required',
        'MAPPING_REQUIRED',
        400
      );
    }

    const { rawData } = readUploadedFile(req.file);

    if (rawData.length === 0) {
      return error(
        res,
        'The uploaded spreadsheet is empty',
        'EMPTY_DATA',
        400
      );
    }

    const mappedRows = rawData.map((row) =>
      mapRow(row, columnMapping)
    );

    const evaluated = await batchCheckDuplicates(
      mappedRows,
      'phone',
      'email'
    );

    const validNew = [];
    const duplicates = [];
    const invalid = [];

    for (const item of evaluated) {
      if (
        !item.data.businessName ||
        !item.normalizedPhone
      ) {
        invalid.push({
          row: item.rowIndex,
          reason: !item.data.businessName
            ? 'Missing Business Name'
            : 'Invalid or Missing Phone Number',
          data: item.data
        });

        continue;
      }

      if (item.duplicateType) {
        duplicates.push({
          row: item.rowIndex,
          type: item.duplicateType,
          reason: item.duplicateReason,
          data: item.data,
          matchedLead: item.matchedLead || null
        });

        continue;
      }

      validNew.push({
        row: item.rowIndex,
        data: item.data,
        normalizedPhone: item.normalizedPhone,
        normalizedEmail: item.normalizedEmail
      });
    }

    return success(
      res,
      {
        total: mappedRows.length,
        validCount: validNew.length,
        duplicateCount: duplicates.length,
        invalidCount: invalid.length,
        sampleValid: validNew.slice(0, 5),
        sampleDuplicates: duplicates.slice(0, 10),
        sampleInvalid: invalid.slice(0, 10)
      },
      'Validation completed'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Execute bulk import
 *
 * IMPORTANT:
 * This function stores leads directly in MongoDB.
 * No localStorage is used here.
 */
const executeImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(
        res,
        'No file uploaded',
        'MISSING_FILE',
        400
      );
    }

    const columnMapping = parseJSON(
      req.body.columnMapping,
      {}
    );

    const importOptions = parseJSON(
      req.body.options,
      {}
    );

    const {
      skipDuplicates = true,
      assignedTo = null,
      assignedTeam = null,
      priority = 'MEDIUM'
    } = importOptions;

    if (
      !columnMapping.businessName ||
      !columnMapping.phone
    ) {
      return error(
        res,
        'Business Name and Phone column mappings are required',
        'MAPPING_REQUIRED',
        400
      );
    }

    const { rawData } = readUploadedFile(req.file);

    if (rawData.length === 0) {
      return error(
        res,
        'The uploaded spreadsheet is empty',
        'EMPTY_DATA',
        400
      );
    }

    const mappedRows = rawData.map((row) =>
      mapRow(row, columnMapping)
    );

    /**
     * Check duplicates against MongoDB
     */
    const evaluated = await batchCheckDuplicates(
      mappedRows,
      'phone',
      'email'
    );

    const toInsert = [];
    const skippedDuplicates = [];
    const invalidRows = [];

    /**
     * Generate lead IDs.
     *
     * NOTE:
     * For extremely high concurrent imports, a dedicated
     * MongoDB counter collection is recommended.
     */
    const existingLeadCount =
      await Lead.countDocuments();

    let currentIdSeq = 10000 + existingLeadCount;

    for (const item of evaluated) {
      const businessName =
        item.data.businessName;

      const normalizedPhone =
        item.normalizedPhone;

      /**
       * Validate required fields
       */
      if (!businessName || !normalizedPhone) {
        invalidRows.push({
          row: item.rowIndex,
          reason:
            'Missing business name or invalid/missing phone number'
        });

        continue;
      }

      /**
       * Handle duplicates
       */
      if (item.duplicateType) {
        skippedDuplicates.push({
          row: item.rowIndex,
          type: item.duplicateType,
          reason: item.duplicateReason
        });

        if (skipDuplicates) {
          continue;
        }
      }

      /**
       * Generate unique-looking lead ID
       */
      currentIdSeq++;

      const randomSuffix = Math.floor(
        1000 + Math.random() * 9000
      );

      const leadId =
        `YP-${currentIdSeq}-${randomSuffix}`;

      /**
       * Normalize alternate phone
       */
      const alternatePhone =
        item.data.alternatePhone
          ? normalizePhoneNumber(
              item.data.alternatePhone
            )
          : null;

      /**
       * Create MongoDB document
       */
      const leadDocument = {
        leadId,

        businessName:
          item.data.businessName,

        ownerName:
          item.data.ownerName || '',

        phoneNumbers: [
          normalizedPhone
        ],

        alternatePhoneNumbers:
          alternatePhone
            ? [alternatePhone]
            : [],

        email:
          item.normalizedEmail ||
          item.data.email ||
          '',

        category:
          item.data.category ||
          'General',

        city:
          item.data.city || '',

        district:
          item.data.district || '',

        state:
          item.data.state || '',

        pincode:
          item.data.pincode || '',

        address:
          item.data.address || '',

        website:
          item.data.website || '',

        source: 'BULK_IMPORT',

        sourceDetails:
          `Imported by ${
            req.user?.name || 'System'
          } on ${new Date().toLocaleDateString()}`,

        priority,

        currentStatus: 'NEW',

        assignedTo:
          assignedTo || null,

        assignedTeam:
          assignedTeam || null,

        assignedBy:
          assignedTo
            ? req.user._id
            : null,

        assignmentDate:
          assignedTo
            ? new Date()
            : null,

        assignmentHistory:
          assignedTo
            ? [
                {
                  fromEmployee: null,
                  toEmployee: assignedTo,
                  assignedBy: req.user._id,
                  assignedAt: new Date(),
                  reason:
                    'Bulk Import Assignment'
                }
              ]
            : []
      };

      toInsert.push(leadDocument);
    }

    /**
     * Insert into MongoDB in chunks.
     *
     * 500 documents per batch prevents
     * very large bulk requests.
     */
    const BATCH_SIZE = 500;

    let successfulInserted = 0;

    for (
      let i = 0;
      i < toInsert.length;
      i += BATCH_SIZE
    ) {
      const chunk =
        toInsert.slice(
          i,
          i + BATCH_SIZE
        );

      if (chunk.length === 0) {
        continue;
      }

      const bulkOps = chunk.map(
        (lead) => ({
          insertOne: {
            document: lead
          }
        })
      );

      const writeRes =
        await Lead.bulkWrite(
          bulkOps,
          {
            ordered: false
          }
        );

      successfulInserted +=
        writeRes.insertedCount || 0;
    }

    /**
     * Save audit information in MongoDB
     */
    await logAudit({
      actor: req.user,
      action: 'BULK_IMPORT',
      entity: 'LEAD',
      entityId: null,
      newValue: {
        totalRows:
          mappedRows.length,

        inserted:
          successfulInserted,

        duplicates:
          skippedDuplicates.length,

        invalid:
          invalidRows.length
      }
    });

    /**
     * Return final import result
     */
    return success(
      res,
      {
        totalRows:
          mappedRows.length,

        successful:
          successfulInserted,

        duplicates:
          skippedDuplicates.length,

        invalid:
          invalidRows.length,

        duplicateRows:
          skippedDuplicates.slice(0, 50),

        invalidRows:
          invalidRows.slice(0, 50)
      },
      `Bulk import finished: ${successfulInserted} leads created`,
      201
    );
  } catch (err) {
    console.error(
      'Bulk import error:',
      err
    );

    next(err);
  }
};

module.exports = {
  previewImport,
  validateImport,
  executeImport
};