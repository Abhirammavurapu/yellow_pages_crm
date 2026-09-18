const Lead = require('../models/Lead');
const {
  normalizePhoneNumber
} = require('../utils/phoneNormalizer');

/**
 * Check if a phone number or email already exists
 * in MongoDB
 */
async function checkDuplicate(
  phoneNumber,
  email = null,
  excludeLeadId = null
) {
  const normalizedPhone =
    normalizePhoneNumber(phoneNumber);

  const normalizedEmail =
    email
      ? String(email).trim().toLowerCase()
      : null;

  if (!normalizedPhone && !normalizedEmail) {
    return {
      isDuplicate: false
    };
  }

  const orConditions = [];

  if (normalizedPhone) {
    orConditions.push({
      phoneNumbers: normalizedPhone
    });
  }

  if (normalizedEmail) {
    orConditions.push({
      email: normalizedEmail
    });
  }

  const query = {
    isDeleted: false,
    $or: orConditions
  };

  if (excludeLeadId) {
    query._id = {
      $ne: excludeLeadId
    };
  }

  const existingLead =
    await Lead.findOne(query)
      .select(
        'leadId businessName phoneNumbers email currentStatus assignedTo'
      )
      .populate(
        'assignedTo',
        'name employeeId role'
      )
      .lean();

  if (!existingLead) {
    return {
      isDuplicate: false
    };
  }

  const phoneNumbers =
    Array.isArray(existingLead.phoneNumbers)
      ? existingLead.phoneNumbers
      : [];

  let duplicateField = 'email';

  if (
    normalizedPhone &&
    phoneNumbers.includes(normalizedPhone)
  ) {
    duplicateField = 'phone';
  }

  return {
    isDuplicate: true,
    existingLead,
    duplicateField
  };
}


/**
 * Batch duplicate check for Excel / CSV import rows
 */
async function batchCheckDuplicates(
  rows,
  phoneKey = 'phone',
  emailKey = 'email'
) {
  const phoneMap = new Map();
  const emailMap = new Map();

  const normalizedPhones = [];
  const normalizedEmails = [];

  /*
   * 1. Check duplicates inside the uploaded file
   */
  const evaluatedRows = rows.map(
    (row, idx) => {
      const rawPhone = row[phoneKey];
      const rawEmail = row[emailKey];

      const normPhone =
        normalizePhoneNumber(rawPhone);

      const normEmail =
        rawEmail
          ? String(rawEmail)
              .trim()
              .toLowerCase()
          : null;

      let duplicateType = null;
      let duplicateReason = null;

      if (normPhone) {
        if (phoneMap.has(normPhone)) {
          duplicateType =
            'FILE_DUPLICATE';

          duplicateReason =
            `Duplicate phone number in row ${
              phoneMap.get(normPhone) + 1
            }`;
        } else {
          phoneMap.set(
            normPhone,
            idx
          );

          normalizedPhones.push(
            normPhone
          );
        }
      }

      if (
        normEmail &&
        !duplicateType
      ) {
        if (emailMap.has(normEmail)) {
          duplicateType =
            'FILE_DUPLICATE';

          duplicateReason =
            `Duplicate email in row ${
              emailMap.get(normEmail) + 1
            }`;
        } else {
          emailMap.set(
            normEmail,
            idx
          );

          normalizedEmails.push(
            normEmail
          );
        }
      }

      return {
        rowIndex: idx + 1,
        data: row,
        normalizedPhone: normPhone,
        normalizedEmail: normEmail,
        duplicateType,
        duplicateReason
      };
    }
  );


  /*
   * 2. Check MongoDB for existing records
   */
  const orConditions = [];

  if (normalizedPhones.length) {
    orConditions.push({
      phoneNumbers: {
        $in: normalizedPhones
      }
    });
  }

  if (normalizedEmails.length) {
    orConditions.push({
      email: {
        $in: normalizedEmails
      }
    });
  }

  let dbDuplicates = [];

  if (orConditions.length) {
    dbDuplicates =
      await Lead.find({
        isDeleted: false,
        $or: orConditions
      })
        .select(
          'leadId businessName phoneNumbers email currentStatus assignedTo'
        )
        .lean();
  }


  /*
   * 3. Build lookup maps
   */
  const dbPhoneMap = new Map();
  const dbEmailMap = new Map();

  for (const lead of dbDuplicates) {
    const phoneNumbers =
      Array.isArray(lead.phoneNumbers)
        ? lead.phoneNumbers
        : [];

    for (const phone of phoneNumbers) {
      dbPhoneMap.set(
        phone,
        lead
      );
    }

    if (lead.email) {
      dbEmailMap.set(
        String(lead.email)
          .trim()
          .toLowerCase(),
        lead
      );
    }
  }


  /*
   * 4. Mark MongoDB duplicates
   */
  for (
    const item of evaluatedRows
  ) {
    if (item.duplicateType) {
      continue;
    }

    if (
      item.normalizedPhone &&
      dbPhoneMap.has(
        item.normalizedPhone
      )
    ) {
      const match =
        dbPhoneMap.get(
          item.normalizedPhone
        );

      item.duplicateType =
        'DB_DUPLICATE';

      item.duplicateReason =
        `Phone number already exists in CRM (Lead ID: ${match.leadId} - ${match.businessName})`;

      item.matchedLead =
        match;

      continue;
    }

    if (
      item.normalizedEmail &&
      dbEmailMap.has(
        item.normalizedEmail
      )
    ) {
      const match =
        dbEmailMap.get(
          item.normalizedEmail
        );

      item.duplicateType =
        'DB_DUPLICATE';

      item.duplicateReason =
        `Email already exists in CRM (Lead ID: ${match.leadId} - ${match.businessName})`;

      item.matchedLead =
        match;
    }
  }

  return evaluatedRows;
}


module.exports = {
  checkDuplicate,
  batchCheckDuplicates
};