import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const galleryDir = path.join(publicDir, 'gallery');
const documentsDir = path.join(publicDir, 'documents');

/**
 * Creates an SMTP nodemailer transporter for a specific school
 */
export async function getSchoolSmtpTransporter(schoolId, prisma) {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        schoolId,
        key: {
          in: [
            'smtp_host',
            'smtp_port',
            'smtp_user',
            'smtp_pass',
            'smtp_secure',
            'smtp_from_name',
            'smtp_from_email'
          ]
        }
      }
    });

    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });

    const host = map.smtp_host || process.env.SMTP_HOST;
    const port = parseInt(map.smtp_port || process.env.SMTP_PORT || '587', 10);
    const user = map.smtp_user || process.env.SMTP_USER;
    const pass = map.smtp_pass || process.env.SMTP_PASS;
    const secure = (map.smtp_secure === 'true' || process.env.SMTP_SECURE === 'true' || port === 465);
    const fromName = map.smtp_from_name || process.env.SMTP_FROM_NAME || 'Comunidad Montessori';
    const fromEmail = map.smtp_from_email || process.env.SMTP_FROM_EMAIL || user || 'no-reply@ceiba.edu';

    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
      return {
        transporter,
        from: `"${fromName}" <${fromEmail}>`,
        fromEmail,
        fromName,
        isConfigured: true
      };
    }
  } catch (err) {
    console.error(`[EMAIL SERVICE] Error initializing SMTP for school ${schoolId}:`, err);
  }

  return {
    transporter: null,
    from: '"Comunidad Montessori" <no-reply@ceiba.edu>',
    fromEmail: 'no-reply@ceiba.edu',
    fromName: 'Comunidad Montessori',
    isConfigured: false
  };
}

/**
 * Resolves an image into an inline MIME CID attachment for Nodemailer
 */
export async function resolveImageForEmail(imageUrl, defaultCidName) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  // 1. Base64 data URL
  if (trimmed.startsWith('data:image/')) {
    const matches = trimmed.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] || 'png';
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: Buffer.from(matches[2], 'base64'),
        contentType: `image/${ext}`
      };
    }
  }

  try {
    let cleanPath = trimmed;
    if (cleanPath.startsWith('http://localhost') || cleanPath.startsWith('http://127.0.0.1')) {
      try {
        const u = new URL(cleanPath);
        cleanPath = u.pathname;
      } catch (_) {}
    }

    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }

    // 2. Check public directory
    const publicPath = path.join(publicDir, cleanPath);
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
      const ext = path.extname(publicPath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      const buf = fs.readFileSync(publicPath);
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: buf,
        contentType: mime
      };
    }

    // 3. Check gallery directory
    const gPath = path.join(galleryDir, path.basename(cleanPath));
    if (fs.existsSync(gPath) && fs.statSync(gPath).isFile()) {
      const ext = path.extname(gPath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      const buf = fs.readFileSync(gPath);
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: buf,
        contentType: mime
      };
    }

    // 4. Check documents directory
    const dPath = path.join(documentsDir, path.basename(cleanPath));
    if (fs.existsSync(dPath) && fs.statSync(dPath).isFile()) {
      const ext = path.extname(dPath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
      const buf = fs.readFileSync(dPath);
      return {
        cid: defaultCidName,
        filename: `${defaultCidName}.${ext}`,
        content: buf,
        contentType: mime
      };
    }

    // 5. Remote URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const response = await fetch(trimmed);
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        const mime = response.headers.get('content-type') || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        return {
          cid: defaultCidName,
          filename: `${defaultCidName}.${ext}`,
          content: Buffer.from(arrayBuf),
          contentType: mime
        };
      }
    }
  } catch (err) {
    console.error(`[EMAIL SERVICE] Error resolving image ${imageUrl} for CID:`, err);
  }

  return null;
}

/**
 * Formats HTML email for newsletters
 */
export function renderNewsletterEmail(newsletter, school, recipient, inlineImages = {}) {
  const primaryColor = school.primaryColor || '#1b3b2b';
  const secondaryColor = school.secondaryColor || '#10b981';
  const schoolName = school.name || 'Comunidad Montessori';
  const recipientName = recipient.name || 'Estimada Familia';
  const studentName = recipient.studentName || 'su hijo/a';
  const environmentName = recipient.environmentName || 'la comunidad escolar';
  const recipientEmail = recipient.email || '';
  const formattedDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const schoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  let bodyHtml = newsletter.contentHtml || '';
  // Dynamic Replacements
  bodyHtml = bodyHtml.replace(/{{nombre_destinatario}}/gi, recipientName);
  bodyHtml = bodyHtml.replace(/{{nombre_tutor}}/gi, recipientName);
  bodyHtml = bodyHtml.replace(/{{destinatario}}/gi, recipientName);
  bodyHtml = bodyHtml.replace(/{{estudiante}}/gi, studentName);
  bodyHtml = bodyHtml.replace(/{{alumno}}/gi, studentName);
  bodyHtml = bodyHtml.replace(/{{hijo}}/gi, studentName);
  bodyHtml = bodyHtml.replace(/{{ambiente}}/gi, environmentName);
  bodyHtml = bodyHtml.replace(/{{salon}}/gi, environmentName);
  bodyHtml = bodyHtml.replace(/{{escuela}}/gi, schoolName);
  bodyHtml = bodyHtml.replace(/{{colegio}}/gi, schoolName);
  bodyHtml = bodyHtml.replace(/{{email_destinatario}}/gi, recipientEmail);
  bodyHtml = bodyHtml.replace(/{{email}}/gi, recipientEmail);
  bodyHtml = bodyHtml.replace(/{{fecha}}/gi, formattedDate);
  bodyHtml = bodyHtml.replace(/{{año_escolar}}/gi, schoolYear);
  bodyHtml = bodyHtml.replace(/{{ciclo_escolar}}/gi, schoolYear);

  const logoSrc = inlineImages.logoCid ? `cid:${inlineImages.logoCid}` : (school.logoUrl || '');
  const coverSrc = inlineImages.coverCid ? `cid:${inlineImages.coverCid}` : (newsletter.coverImageUrl || '');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newsletter.subject || newsletter.title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; }
    .email-wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background-color: ${primaryColor}; color: #ffffff; padding: 32px 32px 28px; text-align: center; }
    .school-logo-container { margin-bottom: 14px; text-align: center; }
    .school-logo { max-height: 64px; max-width: 220px; border-radius: 12px; display: inline-block; object-fit: contain; background: #ffffff; padding: 6px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .school-name { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; margin: 0; color: #ffffff; }
    .school-tagline { font-size: 11px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.2px; color: #ffffff; }
    .cover-image { width: 100%; max-height: 280px; object-fit: cover; display: block; }
    .content { padding: 32px 32px 24px; }
    .preheader { font-size: 13px; color: #64748b; font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 20px; line-height: 1.3; }
    .body-text { font-size: 15px; color: #334155; line-height: 1.7; margin-bottom: 24px; }
    .body-text p { margin: 0 0 16px; }
    .body-text h2, .body-text h3 { color: ${primaryColor}; margin: 24px 0 12px; }
    .body-text ul, .body-text ol { margin: 0 0 16px; padding-left: 24px; }
    .body-text blockquote { border-left: 4px solid ${secondaryColor}; padding: 12px 18px; margin: 18px 0; background: #f0fdf4; border-radius: 0 12px 12px 0; color: #166534; font-style: italic; }
    .body-text a.cta-button { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; margin: 12px 0; }
    .author-block { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; }
    .footer { background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  ${newsletter.preheader ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${newsletter.preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="header">
      ${logoSrc ? `
        <div class="school-logo-container">
          <img src="${logoSrc}" alt="${schoolName}" class="school-logo">
        </div>
      ` : ''}
      <h1 class="school-name">${schoolName}</h1>
      <div class="school-tagline">Boletín Informativo & Comunicado Oficial</div>
    </div>
    ${coverSrc ? `<img src="${coverSrc}" alt="${newsletter.title}" class="cover-image">` : ''}
    <div class="content">
      ${newsletter.preheader ? `<div class="preheader">${newsletter.preheader}</div>` : ''}
      <h2 class="title">${newsletter.title}</h2>
      <div class="body-text">
        ${bodyHtml}
      </div>
      ${Array.isArray(newsletter.attachments) && newsletter.attachments.length > 0 ? `
        <div style="margin-top: 24px; padding: 18px; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 10px; color: ${primaryColor}; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
            📎 Archivos Adjuntos (${newsletter.attachments.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${newsletter.attachments.map(att => `
              <div style="padding: 8px 12px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #1e293b;">${att.fileName}</span>
                <span style="color: #64748b; font-size: 11px;">${Math.round((att.fileSize || 0) / 1024)} KB</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      ${newsletter.authorName ? `
        <div class="author-block">
          <strong>Publicado por:</strong> ${newsletter.authorName}
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px;"><strong>${schoolName}</strong></p>
      ${school.address ? `<p style="margin: 0 0 4px;">${school.address}</p>` : ''}
      <p style="margin: 0;">Este es un comunicado oficial emitido por la administración escolar.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Resolves audience recipients for a newsletter
 */
export async function getNewsletterRecipients(schoolId, filter, prisma) {
  const recipientsMap = new Map();

  // 1. ALL or ALL_STUDENTS / ALL_PARENTS
  if (filter.targetType === 'ALL' || filter.targetType === 'ALL_PARENTS' || filter.targetType === 'ALL_STUDENTS') {
    const students = await prisma.student.findMany({
      where: { schoolId },
      include: { environment: true }
    });

    students.forEach(s => {
      if (filter.targetType === 'ALL' || filter.targetType === 'ALL_STUDENTS') {
        if (s.email && s.email.includes('@')) {
          recipientsMap.set(s.email.toLowerCase(), {
            email: s.email.toLowerCase(),
            name: `${s.firstName} ${s.lastName}`.trim(),
            role: 'STUDENT',
            studentName: `${s.firstName} ${s.lastName}`.trim(),
            environmentName: s.environment?.name || ''
          });
        }
      }

      if (filter.targetType === 'ALL' || filter.targetType === 'ALL_PARENTS') {
        if (s.tutorEmail && s.tutorEmail.includes('@')) {
          recipientsMap.set(s.tutorEmail.toLowerCase(), {
            email: s.tutorEmail.toLowerCase(),
            name: s.tutorName || `Tutor de ${s.firstName}`,
            role: 'PARENT',
            studentName: `${s.firstName} ${s.lastName}`.trim(),
            environmentName: s.environment?.name || ''
          });
        }
      }
    });
  }

  // 2. ENVIRONMENTS
  if (filter.targetType === 'ENVIRONMENTS' && Array.isArray(filter.targetEnvironmentIds) && filter.targetEnvironmentIds.length > 0) {
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        environmentId: { in: filter.targetEnvironmentIds }
      },
      include: { environment: true }
    });

    students.forEach(s => {
      if (filter.targetAudience === 'PARENTS' || filter.targetAudience === 'BOTH') {
        if (s.tutorEmail && s.tutorEmail.includes('@')) {
          recipientsMap.set(s.tutorEmail.toLowerCase(), {
            email: s.tutorEmail.toLowerCase(),
            name: s.tutorName || `Tutor de ${s.firstName}`,
            role: 'PARENT',
            studentName: `${s.firstName} ${s.lastName}`.trim(),
            environmentName: s.environment?.name || ''
          });
        }
      }
      if (filter.targetAudience === 'STUDENTS' || filter.targetAudience === 'BOTH') {
        if (s.email && s.email.includes('@')) {
          recipientsMap.set(s.email.toLowerCase(), {
            email: s.email.toLowerCase(),
            name: `${s.firstName} ${s.lastName}`.trim(),
            role: 'STUDENT',
            studentName: `${s.firstName} ${s.lastName}`.trim(),
            environmentName: s.environment?.name || ''
          });
        }
      }
    });
  }

  // 3. SPECIFIC EMAILS
  if (filter.targetType === 'SPECIFIC_EMAILS' && Array.isArray(filter.specificEmails)) {
    filter.specificEmails.forEach(e => {
      if (e && typeof e === 'string' && e.includes('@')) {
        const clean = e.trim().toLowerCase();
        recipientsMap.set(clean, {
          email: clean,
          name: clean.split('@')[0],
          role: 'CUSTOM',
          studentName: '',
          environmentName: ''
        });
      }
    });
  }

  return Array.from(recipientsMap.values());
}

/**
 * Dispatches a newsletter to all targeted recipients
 */
export async function processNewsletterDispatch(newsletterId, prisma) {
  console.log(`[EMAIL SERVICE] Starting newsletter dispatch ID: ${newsletterId}`);
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
    include: { school: true }
  });
  if (!newsletter) {
    console.error(`[EMAIL SERVICE] Newsletter not found: ${newsletterId}`);
    return { success: false, error: 'Boletín no encontrado' };
  }

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { status: 'SENDING' }
  });

  const school = newsletter.school;
  const siteSettings = await prisma.siteSetting.findMany({ where: { schoolId: school.id } });
  const settingsMap = {};
  siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

  const enrichedSchool = {
    id: school.id,
    name: settingsMap.school_name || school.name || 'Comunidad Montessori',
    logoUrl: settingsMap.school_logo || school.logoUrl || '',
    primaryColor: settingsMap.brand_primary_color || school.primaryColor || '#1b3b2b',
    secondaryColor: settingsMap.brand_secondary_color || school.accentColor || '#10b981',
    address: settingsMap.school_address || school.address || '',
    phone: settingsMap.contact_phone || school.phone || '',
    email: settingsMap.contact_email || school.email || ''
  };

  const mailAttachments = [];
  const inlineImages = {};

  // 1. Resolve school logo as inline CID attachment
  if (enrichedSchool.logoUrl) {
    const logoAttachment = await resolveImageForEmail(enrichedSchool.logoUrl, 'school_logo');
    if (logoAttachment) {
      mailAttachments.push(logoAttachment);
      inlineImages.logoCid = 'school_logo';
    }
  }

  // 2. Resolve cover image as inline CID attachment
  if (newsletter.coverImageUrl) {
    const coverAttachment = await resolveImageForEmail(newsletter.coverImageUrl, 'newsletter_cover');
    if (coverAttachment) {
      mailAttachments.push(coverAttachment);
      inlineImages.coverCid = 'newsletter_cover';
    }
  }

  // 3. Resolve user document attachments (PDFs, docs, etc.)
  const rawAttachments = Array.isArray(newsletter.attachments) ? newsletter.attachments : [];
  for (const att of rawAttachments) {
    if (att && att.fileName && att.fileData) {
      if (typeof att.fileData === 'string' && att.fileData.startsWith('data:')) {
        const matches = att.fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mailAttachments.push({
            filename: att.fileName,
            content: Buffer.from(matches[2], 'base64'),
            contentType: matches[1] || 'application/octet-stream'
          });
        }
      } else if (typeof att.fileData === 'string' && att.fileData.startsWith('http')) {
        mailAttachments.push({
          filename: att.fileName,
          path: att.fileData
        });
      }
    }
  }

  const recipients = await getNewsletterRecipients(school.id, {
    targetType: newsletter.targetType,
    targetAudience: newsletter.targetAudience,
    targetEnvironmentIds: newsletter.targetEnvironmentIds,
    specificEmails: newsletter.specificEmails
  }, prisma);

  const { transporter, from, isConfigured } = await getSchoolSmtpTransporter(school.id, prisma);
  const logs = [];
  let deliveredCount = 0;
  let failedCount = 0;

  for (const r of recipients) {
    const html = renderNewsletterEmail(newsletter, enrichedSchool, r, inlineImages);
    if (isConfigured && transporter) {
      try {
        await transporter.sendMail({
          from,
          to: r.email,
          subject: newsletter.subject || newsletter.title,
          html,
          attachments: mailAttachments.length > 0 ? mailAttachments : undefined
        });
        deliveredCount++;
        logs.push({ email: r.email, name: r.name, status: 'DELIVERED', timestamp: new Date().toISOString() });
      } catch (err) {
        failedCount++;
        logs.push({ email: r.email, name: r.name, status: 'FAILED', error: err.message, timestamp: new Date().toISOString() });
      }
    } else {
      deliveredCount++;
      logs.push({ email: r.email, name: r.name, status: 'DELIVERED', note: 'Simulado (SMTP no configurado)', timestamp: new Date().toISOString() });
    }
  }

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: {
      status: failedCount > 0 && deliveredCount === 0 ? 'FAILED' : 'SENT',
      sentAt: new Date(),
      totalRecipients: recipients.length,
      deliveredCount,
      failedCount,
      logs
    }
  });

  console.log(`[EMAIL SERVICE] Newsletter ${newsletterId} finished. Delivered: ${deliveredCount}, Failed: ${failedCount}`);
  return { success: true, deliveredCount, failedCount };
}

/**
 * Sends a single test newsletter email
 */
export async function processNewsletterTest({ newsletterId, testEmail, schoolId }, prisma) {
  console.log(`[EMAIL SERVICE] Sending test newsletter ${newsletterId} to ${testEmail}`);
  const newsletter = await prisma.newsletter.findFirst({
    where: { id: newsletterId, schoolId }
  });
  if (!newsletter) throw new Error('Boletín no encontrado');

  const siteSettings = await prisma.siteSetting.findMany({ where: { schoolId } });
  const settingsMap = {};
  siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

  const rawLogo = settingsMap.school_logo || '';
  const enrichedSchool = {
    id: schoolId,
    name: settingsMap.school_name || 'Comunidad Montessori',
    logoUrl: rawLogo,
    primaryColor: settingsMap.brand_primary_color || '#1b3b2b',
    secondaryColor: settingsMap.brand_secondary_color || '#10b981',
    address: settingsMap.school_address || '',
    phone: settingsMap.contact_phone || '',
    email: settingsMap.contact_email || ''
  };

  const mailAttachments = [];
  const inlineImages = {};

  if (rawLogo) {
    const logoAttachment = await resolveImageForEmail(rawLogo, 'school_logo');
    if (logoAttachment) {
      mailAttachments.push(logoAttachment);
      inlineImages.logoCid = 'school_logo';
    }
  }

  if (newsletter.coverImageUrl) {
    const coverAttachment = await resolveImageForEmail(newsletter.coverImageUrl, 'newsletter_cover');
    if (coverAttachment) {
      mailAttachments.push(coverAttachment);
      inlineImages.coverCid = 'newsletter_cover';
    }
  }

  const rawAttachments = Array.isArray(newsletter.attachments) ? newsletter.attachments : [];
  for (const att of rawAttachments) {
    if (att && att.fileName && att.fileData) {
      if (typeof att.fileData === 'string' && att.fileData.startsWith('data:')) {
        const matches = att.fileData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mailAttachments.push({
            filename: att.fileName,
            content: Buffer.from(matches[2], 'base64'),
            contentType: matches[1] || 'application/octet-stream'
          });
        }
      } else if (typeof att.fileData === 'string' && att.fileData.startsWith('http')) {
        mailAttachments.push({
          filename: att.fileName,
          path: att.fileData
        });
      }
    }
  }

  const { transporter, from, isConfigured } = await getSchoolSmtpTransporter(schoolId, prisma);
  const html = renderNewsletterEmail(
    newsletter,
    enrichedSchool,
    { name: 'Destinatario de Prueba', email: testEmail.trim(), role: 'TEST' },
    inlineImages
  );

  if (isConfigured && transporter) {
    await transporter.sendMail({
      from,
      to: testEmail.trim(),
      subject: `[PRUEBA] ${newsletter.subject || newsletter.title}`,
      html,
      attachments: mailAttachments.length > 0 ? mailAttachments : undefined
    });
  } else {
    console.log(`[EMAIL SERVICE SIMULATED TEST] To: ${testEmail} | Subject: [PRUEBA] ${newsletter.subject || newsletter.title}`);
  }

  return { success: true, testEmail };
}

/**
 * Sends admission portal OTP verification email with branded header, logo and security disclaimer
 */
export async function processAdmissionOtpEmail({ schoolId, tutorEmail, tutorName, childName, code, token }, prisma) {
  console.log(`[EMAIL SERVICE] Sending admission OTP to ${tutorEmail} for school: ${schoolId}`);

  let school = null;
  if (schoolId) {
    school = await prisma.school.findUnique({ where: { id: schoolId } });
  }
  if (!school) {
    school = await prisma.school.findFirst() || {};
  }

  const siteSettings = school?.id ? await prisma.siteSetting.findMany({ where: { schoolId: school.id } }) : [];
  const settingsMap = {};
  siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

  const primaryColor = settingsMap.brand_primary_color || school.primaryColor || '#1b3b2b';
  const secondaryColor = settingsMap.brand_secondary_color || school.accentColor || '#10b981';
  const schoolName = settingsMap.school_name || school.name || 'Comunidad Montessori';
  const schoolAddress = settingsMap.school_address || school.address || '';
  const contactPhone = settingsMap.contact_phone || school.phone || '';
  const contactEmail = settingsMap.contact_email || school.email || '';

  const rawLogo = settingsMap.school_logo || school.logoUrl || '';
  const mailAttachments = [];
  let logoSrc = '';

  if (rawLogo) {
    const logoAtt = await resolveImageForEmail(rawLogo, 'school_logo');
    if (logoAtt) {
      mailAttachments.push(logoAtt);
      logoSrc = 'cid:school_logo';
    } else if (rawLogo.startsWith('http')) {
      logoSrc = rawLogo;
    }
  }

  const { transporter, from, isConfigured } = await getSchoolSmtpTransporter(schoolId || school.id, prisma);
  let emailSent = false;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Verificación - ${schoolName}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; }
    .email-wrapper { max-width: 540px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
    .header { background-color: ${primaryColor}; color: #ffffff; padding: 30px 24px 26px; text-align: center; }
    .school-logo-container { margin-bottom: 12px; text-align: center; }
    .school-logo { max-height: 60px; max-width: 210px; border-radius: 12px; display: inline-block; object-fit: contain; background: #ffffff; padding: 6px 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .school-name { font-size: 19px; font-weight: bold; margin: 0; color: #ffffff; letter-spacing: 0.5px; }
    .school-tagline { font-size: 11px; opacity: 0.9; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.2px; color: #ffffff; }
    .content { padding: 32px 28px 24px; text-align: center; }
    .security-badge { display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .title { font-size: 21px; font-weight: 800; color: #0f172a; margin: 0 0 16px; line-height: 1.3; }
    .greeting { font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 16px; text-align: left; }
    .otp-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 18px; padding: 22px 16px; margin: 24px 0 20px; text-align: center; box-shadow: inset 0 2px 4px rgba(22, 163, 74, 0.05); }
    .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #15803d; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; display: block; margin-left: 12px; }
    .otp-expiry { font-size: 11px; font-weight: 600; color: #166534; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .disclaimer-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; margin-top: 24px; text-align: left; font-size: 11px; color: #64748b; line-height: 1.5; }
    .disclaimer-title { font-weight: 700; color: #334155; margin-bottom: 4px; display: block; }
    .footer { background-color: #f1f5f9; padding: 22px 28px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header with School Primary Color & Logo -->
    <div class="header">
      ${logoSrc ? `
        <div class="school-logo-container">
          <img src="${logoSrc}" alt="${schoolName}" class="school-logo">
        </div>
      ` : ''}
      <h1 class="school-name">${schoolName}</h1>
      <div class="school-tagline">Portal de Admisión Escolar</div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div>
        <span class="security-badge">🔒 Verificación de Identidad</span>
      </div>
      <h2 class="title">Código de Autorización</h2>

      <div class="greeting">
        <p style="margin: 0 0 10px;">Estimado(a) <strong>${tutorName || 'Tutor / Familia'}</strong>,</p>
        <p style="margin: 0;">
          Para acceder de forma segura al expediente de admisión de <strong>${childName || 'su hijo(a)'}</strong>, ingrese el siguiente código de seguridad de un solo uso en el portal:
        </p>
      </div>

      <!-- OTP Display Box -->
      <div class="otp-box">
        <span class="otp-code">${code}</span>
        <div class="otp-expiry">⏱️ Válido por 15 minutos • Código único de 6 dígitos</div>
      </div>

      <!-- Security Disclaimer Card -->
      <div class="disclaimer-card">
        <span class="disclaimer-title">🛡️ Aviso de Seguridad</span>
        Este código es personal, confidencial e intransferible. El personal de la institución nunca le solicitará este código por teléfono, WhatsApp o correo. Si usted no solicitó este código, puede ignorar este mensaje con total tranquilidad; el expediente permanece protegido.
      </div>
    </div>

    <!-- Footer with School Information & Policies -->
    <div class="footer">
      <p style="margin: 0 0 4px; font-weight: bold; color: #334155; font-size: 12px;">${schoolName}</p>
      ${schoolAddress ? `<p style="margin: 0 0 4px;">${schoolAddress}</p>` : ''}
      ${(contactPhone || contactEmail) ? `
        <p style="margin: 0 0 6px;">
          ${contactPhone ? `Tel: ${contactPhone}` : ''}
          ${(contactPhone && contactEmail) ? ' • ' : ''}
          ${contactEmail ? `Contacto: <a href="mailto:${contactEmail}" style="color:${primaryColor};text-decoration:none;">${contactEmail}</a>` : ''}
        </p>
      ` : ''}
      <p style="margin: 6px 0 0; font-size: 10px; color: #94a3b8;">
        Este es un comunicado oficial automatizado emitido por el sistema institucional de admisiones.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  if (isConfigured && transporter) {
    try {
      await transporter.sendMail({
        from,
        to: tutorEmail,
        subject: `Código de verificación: ${code} - Proceso de Admisión`,
        html,
        attachments: mailAttachments.length > 0 ? mailAttachments : undefined
      });
      emailSent = true;
      console.log(`[EMAIL SERVICE] Admission OTP sent successfully to ${tutorEmail}`);
    } catch (mailErr) {
      console.error('[EMAIL SERVICE] Error sending admission portal OTP email:', mailErr);
      throw mailErr;
    }
  }

  if (!emailSent) {
    console.log(`\n======================================================\n[ADMISSION PORTAL OTP] Token: ${token} | Email: ${tutorEmail} | OTP CODE: ${code}\n======================================================\n`);
  }

  return { success: true, emailSent };
}

/**
 * Renders HTML email for an admission stage notification (entry, exit, completion, rejection)
 */
export function renderStageNotificationEmail({
  school,
  application,
  stage,
  type = 'STAGE_STARTED', // 'STAGE_STARTED' | 'STAGE_COMPLETED' | 'STAGE_REJECTED'
  customSubject,
  customBody,
  portalUrl,
  inlineImages = {}
}) {
  const primaryColor = school.primaryColor || '#1b3b2b';
  const secondaryColor = school.secondaryColor || '#10b981';
  const stageColor = stage?.color || primaryColor;
  const schoolName = school.name || 'Comunidad Montessori';
  const tutorName = application.tutorName || 'Estimada Familia';
  const childName = application.childName || 'el aspirante';
  const stageName = stage?.name || 'Etapa de Admisión';

  const logoSrc = inlineImages.logoCid ? `cid:${inlineImages.logoCid}` : (school.logoUrl || '');

  let headline = `Nueva Etapa: ${stageName}`;
  let badgeText = 'Inicio de Etapa';
  let badgeBg = '#f0fdf4';
  let badgeColor = '#166534';
  let badgeBorder = '#bbf7d0';

  if (type === 'STAGE_COMPLETED') {
    headline = `Etapa Completada: ${stageName}`;
    badgeText = 'Etapa Finalizada';
    badgeBg = '#eff6ff';
    badgeColor = '#1e40af';
    badgeBorder = '#bfdbfe';
  } else if (type === 'STAGE_REJECTED') {
    headline = `Actualización de Solicitud`;
    badgeText = 'Estado de Solicitud';
    badgeBg = '#fef2f2';
    badgeColor = '#991b1b';
    badgeBorder = '#fecaca';
  }

  // Handle custom body or default template
  let contentHtml = '';
  if (customBody) {
    let templated = customBody
      .replace(/{nombre_aspirante}/gi, childName)
      .replace(/{nombre_tutor}/gi, tutorName)
      .replace(/{nombre_etapa}/gi, stageName)
      .replace(/{nombre_escuela}/gi, schoolName)
      .replace(/{link_portal}/gi, portalUrl);
    contentHtml = templated.split('\n\n').map(p => `<p style="margin: 0 0 14px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br>')}</p>`).join('');
  } else {
    if (type === 'STAGE_STARTED') {
      const stageDescription = stage?.description || stage?.hooksConfig?.welcomeMessage || '';
      const requiredForms = Array.isArray(stage?.requiredForms) ? stage.requiredForms : [];
      const requiredDocs = Array.isArray(stage?.requiredDocuments) ? stage.requiredDocuments : [];

      contentHtml = `
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
          Estimado(a) <strong>${tutorName}</strong>,
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
          Le informamos que la solicitud de admisión de <strong>${childName}</strong> ha avanzado a la etapa: <strong style="color: ${primaryColor};">${stageName}</strong>.
        </p>
        ${stageDescription ? `
          <div style="background-color: #f8fafc; border-left: 4px solid ${stageColor}; padding: 14px 18px; margin: 18px 0; border-radius: 0 12px 12px 0;">
            <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5; font-style: italic;">
              ${stageDescription}
            </p>
          </div>
        ` : ''}
        ${(requiredForms.length > 0 || requiredDocs.length > 0) ? `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px; color: ${primaryColor}; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
              📋 Requerimientos de esta etapa:
            </h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
              ${requiredForms.map(f => `<li>Formulario: <strong>${f.formTitle || 'Formulario requerido'}</strong> ${f.isMandatory !== false ? '<span style="color:#e11d48;font-size:11px;">(Obligatorio)</span>' : '<span style="color:#64748b;font-size:11px;">(Opcional)</span>'}</li>`).join('')}
              ${requiredDocs.map(d => `<li>Documento: <strong>${d}</strong></li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.6;">
          Para completar los requisitos y dar seguimiento en tiempo real al proceso, ingrese al expediente virtual en el portal de admisión:
        </p>
      `;
    } else if (type === 'STAGE_COMPLETED') {
      contentHtml = `
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
          Estimado(a) <strong>${tutorName}</strong>,
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
          Nos complace informarle que la etapa <strong style="color: ${primaryColor};">"${stageName}"</strong> para el aspirante <strong>${childName}</strong> ha concluido satisfactoriamente.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.6;">
          Nuestro equipo de admisiones se encuentra revisando los avances para dar paso a la siguiente fase del proceso.
        </p>
      `;
    } else if (type === 'STAGE_REJECTED') {
      contentHtml = `
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
          Estimado(a) <strong>${tutorName}</strong>,
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
          Le informamos que ha habido una actualización en la solicitud de admisión de <strong>${childName}</strong>.
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.6;">
          Puede consultar los detalles ingresando al portal de admisión.
        </p>
      `;
    }
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; }
    .email-wrapper { max-width: 580px; margin: 20px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background-color: ${primaryColor}; color: #ffffff; padding: 28px 24px; text-align: center; }
    .school-logo { max-height: 58px; max-width: 200px; border-radius: 10px; display: inline-block; object-fit: contain; background: #ffffff; padding: 6px 12px; margin-bottom: 12px; }
    .school-name { font-size: 18px; font-weight: bold; margin: 0; color: #ffffff; }
    .school-tagline { font-size: 11px; opacity: 0.9; margin-top: 3px; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; }
    .content { padding: 30px 26px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 16px; line-height: 1.3; }
    .applicant-pill { background: #f1f5f9; padding: 8px 14px; border-radius: 10px; font-size: 13px; color: #334155; margin-bottom: 20px; border: 1px solid #e2e8f0; display: inline-block; }
    .cta-container { text-align: center; margin: 28px 0 10px; }
    .cta-button { display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; padding: 13px 32px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; box-shadow: 0 4px 10px rgba(0,0,0,0.12); }
    .footer { background-color: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      ${logoSrc ? `<img src="${logoSrc}" alt="${schoolName}" class="school-logo">` : ''}
      <h1 class="school-name">${schoolName}</h1>
      <div class="school-tagline">Proceso de Admisión Escolar</div>
    </div>
    <div class="content">
      <div><span class="badge">${badgeText}</span></div>
      <h2 class="title">${headline}</h2>
      <div class="applicant-pill">
        Aspirante: <strong>${childName}</strong>
      </div>
      <div>
        ${contentHtml}
      </div>
      ${portalUrl ? `
        <div class="cta-container">
          <a href="${portalUrl}" class="cta-button" target="_blank">
            Acceder al Portal de Admisión →
          </a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px;"><strong>${schoolName}</strong></p>
      ${school.address ? `<p style="margin: 0 0 4px;">${school.address}</p>` : ''}
      <p style="margin: 0;">Este mensaje fue generado automáticamente por el sistema de admisiones.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates a signed, URL-safe authentication token for an admission portal recipient
 */
export function generateAdmissionPortalSignedToken(application, recipientEmail, expiresInMs = 30 * 24 * 60 * 60 * 1000) {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'ceiba-roots-admission-secret-key-2026';
  const email = (recipientEmail || application?.tutorEmail || '').trim().toLowerCase();
  const exp = Date.now() + expiresInMs;

  const payload = {
    appId: application?.id,
    portalToken: application?.portalToken || application?.id,
    email,
    tutorName: application?.tutorName || '',
    exp
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a signed authentication token for an admission portal
 */
export function verifyAdmissionPortalSignedToken(tokenString, targetTokenOrAppId) {
  if (!tokenString || typeof tokenString !== 'string' || !tokenString.includes('.')) return null;
  const [payloadB64, signature] = tokenString.split('.');
  if (!payloadB64 || !signature) return null;

  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'ceiba-roots-admission-secret-key-2026';
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || !payload.appId || !payload.exp) return null;
    if (payload.exp < Date.now()) return null; // expired

    if (targetTokenOrAppId) {
      if (payload.appId !== targetTokenOrAppId && payload.portalToken !== targetTokenOrAppId) {
        return null;
      }
    }

    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Processes and sends all notification emails when an application changes stage (enters a new stage or completes/exits a stage)
 */
export async function processStageTransitionNotifications({
  applicationId,
  fromStageId,
  toStageId,
  transitionType = 'BOTH' // 'ENTER' | 'EXIT' | 'BOTH'
}, prisma) {
  console.log(`[STAGE NOTIFICATIONS] Processing transition for app: ${applicationId} (From: ${fromStageId} -> To: ${toStageId}, Type: ${transitionType})`);

  const application = await prisma.admissionApplication.findUnique({
    where: { id: applicationId },
    include: {
      school: true,
      stage: true
    }
  });

  if (!application || !application.tutorEmail) {
    console.log(`[STAGE NOTIFICATIONS] Application ${applicationId} not found or has no tutor email. Skipping.`);
    return { success: false, reason: 'No application or tutor email' };
  }

  const school = application.school;
  const siteSettings = await prisma.siteSetting.findMany({ where: { schoolId: school.id } });
  const settingsMap = {};
  siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

  const rawLogo = settingsMap.school_logo || school.logoUrl || '';
  const enrichedSchool = {
    id: school.id,
    name: settingsMap.school_name || school.name || 'Comunidad Montessori',
    logoUrl: rawLogo,
    primaryColor: settingsMap.brand_primary_color || school.primaryColor || '#1b3b2b',
    secondaryColor: settingsMap.brand_secondary_color || school.accentColor || '#10b981',
    address: settingsMap.school_address || school.address || '',
    phone: settingsMap.contact_phone || school.phone || '',
    email: settingsMap.contact_email || school.email || ''
  };

  const mailAttachments = [];
  const inlineImages = {};
  if (rawLogo) {
    const logoAtt = await resolveImageForEmail(rawLogo, 'school_logo');
    if (logoAtt) {
      mailAttachments.push(logoAtt);
      inlineImages.logoCid = 'school_logo';
    }
  }

  const { transporter, from, isConfigured } = await getSchoolSmtpTransporter(school.id, prisma);

  const baseUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:8080';
  const appToken = application.portalToken || application.id;

  // Generate personalized portal URL with cryptographically signed auto-auth token for the recipient
  const getPersonalizedPortalUrl = (targetEmail) => {
    const signedToken = generateAdmissionPortalSignedToken(application, targetEmail);
    return `${baseUrl}/admision/${appToken}?auth_token=${signedToken}`;
  };

  const emailsToSend = [];

  // 1. EXIT STAGE NOTIFICATION (if fromStageId exists and transitionType is 'EXIT' or 'BOTH')
  if (fromStageId && (transitionType === 'EXIT' || transitionType === 'BOTH')) {
    const fromStage = await prisma.admissionStage.findUnique({ where: { id: fromStageId } });
    if (fromStage) {
      const hooks = fromStage.hooksConfig || {};
      const customAutomations = Array.isArray(hooks.custom_automations) ? hooks.custom_automations : [];
      const exitAutomations = customAutomations.filter(a => a.enabled !== false && a.trigger === 'ON_EXIT_STAGE' && a.actionType === 'SEND_EMAIL');

      if (exitAutomations.length > 0) {
        for (const auto of exitAutomations) {
          const recipient = auto.emailTarget === 'CUSTOM' && auto.emailCustomAddress ? auto.emailCustomAddress : application.tutorEmail;
          const portalUrl = getPersonalizedPortalUrl(recipient);
          const subject = (auto.emailSubject || `Etapa finalizada: ${fromStage.name} - ${application.childName}`)
            .replace(/{nombre_aspirante}/gi, application.childName)
            .replace(/{nombre_etapa}/gi, fromStage.name);
          const html = renderStageNotificationEmail({
            school: enrichedSchool,
            application,
            stage: fromStage,
            type: 'STAGE_COMPLETED',
            customSubject: subject,
            customBody: auto.emailBody,
            portalUrl,
            inlineImages
          });
          emailsToSend.push({ to: recipient, subject, html });
        }
      }
    }
  }

  // 2. ENTER STAGE NOTIFICATION (if toStageId exists and transitionType is 'ENTER' or 'BOTH')
  if (toStageId && (transitionType === 'ENTER' || transitionType === 'BOTH')) {
    const toStage = await prisma.admissionStage.findUnique({ where: { id: toStageId } });
    if (toStage) {
      const hooks = toStage.hooksConfig || {};
      const shouldNotifyDefault = hooks.notifyTutorOnEnter === true || toStage.isInitial || toStage.isFinal || toStage.isTerminalRejected;
      const customAutomations = Array.isArray(hooks.custom_automations) ? hooks.custom_automations : [];
      const enterAutomations = customAutomations.filter(a => a.enabled !== false && a.trigger === 'ON_ENTER_STAGE' && a.actionType === 'SEND_EMAIL');

      if (enterAutomations.length > 0) {
        for (const auto of enterAutomations) {
          const recipient = auto.emailTarget === 'CUSTOM' && auto.emailCustomAddress ? auto.emailCustomAddress : application.tutorEmail;
          const portalUrl = getPersonalizedPortalUrl(recipient);
          const subject = (auto.emailSubject || `Nueva etapa de admisión: ${toStage.name} - ${application.childName}`)
            .replace(/{nombre_aspirante}/gi, application.childName)
            .replace(/{nombre_etapa}/gi, toStage.name);
          const html = renderStageNotificationEmail({
            school: enrichedSchool,
            application,
            stage: toStage,
            type: toStage.isTerminalRejected ? 'STAGE_REJECTED' : 'STAGE_STARTED',
            customSubject: subject,
            customBody: auto.emailBody,
            portalUrl,
            inlineImages
          });
          emailsToSend.push({ to: recipient, subject, html });
        }
      } else if (shouldNotifyDefault) {
        // Default standard stage entry email
        let defaultSubject = `[Admisión] ${application.childName} - Nueva etapa: ${toStage.name}`;
        if (toStage.isFinal) defaultSubject = `🎉 [Admisión] ¡Felicidades! Solicitud de ${application.childName} aceptada`;
        if (toStage.isTerminalRejected) defaultSubject = `[Admisión] Actualización de la solicitud de ${application.childName}`;

        const portalUrl = getPersonalizedPortalUrl(application.tutorEmail);
        const html = renderStageNotificationEmail({
          school: enrichedSchool,
          application,
          stage: toStage,
          type: toStage.isTerminalRejected ? 'STAGE_REJECTED' : 'STAGE_STARTED',
          portalUrl,
          inlineImages
        });
        emailsToSend.push({ to: application.tutorEmail, subject: defaultSubject, html });
      }
    }
  }

  // Send all resolved emails
  let sentCount = 0;
  for (const mail of emailsToSend) {
    if (isConfigured && transporter) {
      try {
        await transporter.sendMail({
          from,
          to: mail.to,
          subject: mail.subject,
          html: mail.html,
          attachments: mailAttachments.length > 0 ? mailAttachments : undefined
        });
        sentCount++;
        console.log(`[STAGE NOTIFICATIONS DELIVERED] To: ${mail.to} | Subject: "${mail.subject}"`);
      } catch (sendErr) {
        console.error(`[STAGE NOTIFICATIONS FAILED] To: ${mail.to} | Error:`, sendErr.message);
      }
    } else {
      sentCount++;
      console.log(`[STAGE NOTIFICATIONS SIMULATED] To: ${mail.to} | Subject: "${mail.subject}"`);
    }
  }

  return { success: true, sentCount, total: emailsToSend.length };
}
