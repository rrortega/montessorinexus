import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates a clean, professional PDF summary of a completed form submission
 * 
 * @param {Object} params
 * @param {string} params.formTitle
 * @param {string} [params.formCategory]
 * @param {string} [params.schoolName]
 * @param {string} params.respondentName
 * @param {string} [params.respondentEmail]
 * @param {string} [params.submittedAt]
 * @param {Array} params.sections - Parsed form sections with fields and values
 * @param {Record<string, any>} params.formData - Raw form submission data
 * @param {Record<string, string>} [params.fieldLabels] - Field label mappings
 * @param {string} [params.signatureBase64] - Digital signature PNG data URL
 * @returns {Promise<Buffer>}
 */
export async function generateFormSubmissionPdf({
  formTitle,
  formCategory = 'ADMISIÓN',
  schoolName = 'Ceiba Roots Montessori',
  respondentName,
  respondentEmail = '',
  submittedAt = new Date().toISOString(),
  sections = [],
  formData = {},
  fieldLabels = {},
  signatureBase64 = null
}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette (Forest Green & Slate)
  const colorForest = rgb(0.12, 0.35, 0.24);       // #1F593D
  const colorForestDark = rgb(0.08, 0.25, 0.17);
  const colorDarkText = rgb(0.1, 0.15, 0.12);
  const colorMuted = rgb(0.4, 0.45, 0.42);
  const colorBorder = rgb(0.85, 0.9, 0.87);
  const colorBgLight = rgb(0.96, 0.98, 0.97);
  const colorWhite = rgb(1, 1, 1);
  const colorEmeraldBadge = rgb(0.05, 0.6, 0.38);

  const pageWidth = 595.28;  // A4
  const pageHeight = 841.89; // A4
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const addNewPageIfNeeded = (requiredHeight = 40) => {
    if (y - requiredHeight < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      return true;
    }
    return false;
  };

  // Draw Header Banner
  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: contentWidth,
    height: 55,
    color: colorForest,
    borderWidth: 0
  });

  page.drawText(schoolName.toUpperCase(), {
    x: margin + 16,
    y: y - 22,
    size: 11,
    font: fontBold,
    color: colorWhite
  });

  page.drawText('EXPEDIENTE DIGITAL DE ADMISIÓN • CONSTANCIA DE FORMULARIO', {
    x: margin + 16,
    y: y - 42,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.8, 0.92, 0.86)
  });

  y -= 75;

  // Form Title & Meta
  page.drawText(formTitle, {
    x: margin,
    y: y,
    size: 16,
    font: fontBold,
    color: colorDarkText
  });
  y -= 18;

  const dateFormatted = new Date(submittedAt).toLocaleString('es-MX', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  page.drawText(`Remitente: ${respondentName} ${respondentEmail ? `(${respondentEmail})` : ''}  |  Fecha: ${dateFormatted}`, {
    x: margin,
    y: y,
    size: 9,
    font: fontRegular,
    color: colorMuted
  });
  y -= 25;

  // Render Sections and Answers
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx];
    const fields = section.fields || [];
    if (fields.length === 0) continue;

    addNewPageIfNeeded(50);

    // Section Header Box
    page.drawRectangle({
      x: margin,
      y: y - 20,
      width: contentWidth,
      height: 20,
      color: colorBgLight,
      borderColor: colorBorder,
      borderWidth: 1
    });

    page.drawText(`${sIdx + 1}. ${section.title || 'Sección'}`, {
      x: margin + 10,
      y: y - 14,
      size: 9.5,
      font: fontBold,
      color: colorForestDark
    });
    y -= 28;

    // Fields
    for (const f of fields) {
      let rawVal = formData[f.id];
      if (rawVal === undefined || rawVal === null || rawVal === '') {
        rawVal = '—';
      }

      // Format Value Text
      let valText = '';
      if (typeof rawVal === 'object') {
        if (rawVal.curp) {
          valText = `CURP: ${rawVal.curp} ${rawVal.nombre ? `(${rawVal.nombre} ${rawVal.apellidoPaterno || ''})` : ''}`;
        } else if (rawVal.firstName || rawVal.paternalLastName) {
          valText = [rawVal.firstName, rawVal.paternalLastName, rawVal.maternalLastName].filter(Boolean).join(' ');
        } else {
          valText = JSON.stringify(rawVal);
        }
      } else if (typeof rawVal === 'boolean') {
        valText = rawVal ? 'Sí / Aceptado' : 'No';
      } else {
        valText = String(rawVal);
      }

      const label = f.label || fieldLabels[f.id] || f.id;

      addNewPageIfNeeded(32);

      // Question Label
      page.drawText(label, {
        x: margin + 8,
        y: y,
        size: 8.5,
        font: fontBold,
        color: colorMuted
      });
      y -= 12;

      // Answer Value
      const cleanVal = valText.length > 100 ? `${valText.substring(0, 97)}...` : valText;
      page.drawText(cleanVal, {
        x: margin + 8,
        y: y,
        size: 9.5,
        font: fontRegular,
        color: colorDarkText
      });

      // Subtle separator line
      y -= 6;
      page.drawLine({
        start: { x: margin + 8, y: y },
        end: { x: pageWidth - margin - 8, y: y },
        thickness: 0.5,
        color: rgb(0.9, 0.93, 0.91)
      });
      y -= 12;
    }
    y -= 10;
  }

  // Signature Block if available
  if (signatureBase64) {
    try {
      addNewPageIfNeeded(110);

      page.drawRectangle({
        x: margin,
        y: y - 95,
        width: contentWidth,
        height: 95,
        color: colorBgLight,
        borderColor: colorBorder,
        borderWidth: 1
      });

      page.drawText('FIRMA DIGITAL DEL REMITENTE / TUTOR', {
        x: margin + 12,
        y: y - 16,
        size: 8.5,
        font: fontBold,
        color: colorForestDark
      });

      page.drawText(`Firmado digitalmente por: ${respondentName} • ${dateFormatted}`, {
        x: margin + 12,
        y: y - 28,
        size: 7.5,
        font: fontRegular,
        color: colorMuted
      });

      // Embed Signature Image
      const cleanSigBase64 = signatureBase64.replace(/^data:image\/png;base64,/, '');
      const sigImageBytes = Buffer.from(cleanSigBase64, 'base64');
      const sigImage = await pdfDoc.embedPng(sigImageBytes);
      const sigDims = sigImage.scale(0.35);

      page.drawImage(sigImage, {
        x: margin + 12,
        y: y - 88,
        width: Math.min(sigDims.width, 180),
        height: Math.min(sigDims.height, 50)
      });

      y -= 105;
    } catch (sigErr) {
      console.warn('[PDF GENERATION] Failed to embed signature image:', sigErr.message);
    }
  }

  // Footer on current page
  page.drawText(`Documento oficial generado por Sistema de Admisiones ${schoolName} • ID de Transacción Digital`, {
    x: margin,
    y: 20,
    size: 7.5,
    font: fontItalic,
    color: colorMuted
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
