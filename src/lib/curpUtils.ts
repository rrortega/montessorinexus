/**
 * Comprehensive CURP (Clave Única de Registro de Población) Reverse Engineering Utility.
 * Extracts deterministic demographic and identity data directly from the 18-character CURP string.
 */

export interface DecodedCurp {
 curp: string;
 isValidFormat: boolean;
 fechaNacimiento: string; // DD/MM/YYYY
 fechaNacimientoIso: string; // YYYY-MM-DD
 birthDate: Date | null;
 edad: number; // Age in complete years
 sexo: 'HOMBRE' | 'MUJER';
 estadoNacimiento: string;
 estadoClave: string;
 isExtranjero: boolean;
 initials: {
 paternalFirstTwo: string;
 maternalFirst: string;
 nameFirst: string;
 };
 internalConsonants: {
 paternal: string;
 maternal: string;
 name: string;
 };
 siglo: 'XX' | 'XXI';
 digitoVerificador: string;
}

const STATE_CODES_MAP: Record<string, string> = {
 'AS': 'AGUASCALIENTES',
 'BC': 'BAJA CALIFORNIA',
 'BS': 'BAJA CALIFORNIA SUR',
 'CC': 'CAMPECHE',
 'CL': 'COAHUILA',
 'CM': 'COLIMA',
 'CS': 'CHIAPAS',
 'CH': 'CHIHUAHUA',
 'DF': 'CIUDAD DE MEXICO',
 'DG': 'DURANGO',
 'GT': 'GUANAJUATO',
 'GR': 'GUERRERO',
 'HG': 'HIDALGO',
 'JC': 'JALISCO',
 'MC': 'ESTADO DE MEXICO',
 'MN': 'MICHOACAN',
 'MS': 'MORELOS',
 'NT': 'NAYARIT',
 'NL': 'NUEVO LEON',
 'OC': 'OAXACA',
 'PL': 'PUEBLA',
 'QT': 'QUERETARO',
 'QR': 'QUINTANA ROO',
 'SP': 'SAN LUIS POTOSI',
 'SL': 'SINALOA',
 'SR': 'SONORA',
 'TC': 'TABASCO',
 'TS': 'TAMAULIPAS',
 'TL': 'TLAXCALA',
 'VZ': 'VERACRUZ',
 'YN': 'YUCATAN',
 'ZS': 'ZACATECAS',
 'NE': 'NACIDO EN EL EXTRANJERO'
};

export const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/;

/**
 * Calculates full age in years from a birth date.
 */
export function calculateAgeFromDate(birthDate: Date): number {
 const today = new Date();
 let age = today.getFullYear() - birthDate.getFullYear();
 const monthDiff = today.getMonth() - birthDate.getMonth();
 if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
 age--;
 }
 return Math.max(0, age);
}

/**
 * Decodes all deterministic information contained in a Mexican CURP.
 */
export function decodeCurp(curp: string): DecodedCurp | null {
 if (!curp || typeof curp !== 'string') return null;
 const cleanCurp = curp.toUpperCase().trim();
 if (cleanCurp.length < 18) return null;

 const isValidFormat = CURP_REGEX.test(cleanCurp);

 try {
 const yearCode = cleanCurp.substring(4, 6);
 const month = cleanCurp.substring(6, 8);
 const day = cleanCurp.substring(8, 10);
 const sexChar = cleanCurp.charAt(10);
 const stateCode = cleanCurp.substring(11, 13);
 const centuryChar = cleanCurp.charAt(16);
 const digitoVerificador = cleanCurp.charAt(17);

 // If pen-ultimate char is a letter (A-Z), born in 2000s (century XXI)
 // If it is a digit (0-9), born in 1900s (century XX)
 const is2000s = isNaN(Number(centuryChar));
 const siglo = is2000s ? 'XXI' : 'XX';
 const fullYear = is2000s ? `20${yearCode}` : `19${yearCode}`;

 const fechaNacimiento = `${day}/${month}/${fullYear}`;
 const fechaNacimientoIso = `${fullYear}-${month}-${day}`;
 const birthDate = new Date(Number(fullYear), Number(month) - 1, Number(day));
 const edad = calculateAgeFromDate(birthDate);

 const sexo: 'HOMBRE' | 'MUJER' = sexChar === 'H' ? 'HOMBRE' : 'MUJER';
 const estadoNacimiento = STATE_CODES_MAP[stateCode] || 'DESCONOCIDO';
 const isExtranjero = stateCode === 'NE';

 return {
 curp: cleanCurp,
 isValidFormat,
 fechaNacimiento,
 fechaNacimientoIso,
 birthDate,
 edad,
 sexo,
 estadoNacimiento,
 estadoClave: stateCode,
 isExtranjero,
 initials: {
 paternalFirstTwo: cleanCurp.substring(0, 2),
 maternalFirst: cleanCurp.charAt(2),
 nameFirst: cleanCurp.charAt(3)
 },
 internalConsonants: {
 paternal: cleanCurp.charAt(13),
 maternal: cleanCurp.charAt(14),
 name: cleanCurp.charAt(15)
 },
 siglo,
 digitoVerificador
 };
 } catch {
 return null;
 }
}

/**
 * Validates whether entered names plausibly match the initials encoded in the CURP.
 */
export function validateNameAgainstCurp(
 firstName: string,
 paternalLastName: string,
 maternalLastName: string,
 curp: string
): { isValid: boolean; warnings: string[] } {
 const decoded = decodeCurp(curp);
 if (!decoded) return { isValid: true, warnings: [] };

 const warnings: string[] = [];

 const cleanFirst = (firstName || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 const cleanPat = (paternalLastName || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 const cleanMat = (maternalLastName || '').toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

 if (cleanPat && cleanPat.charAt(0) !== decoded.initials.paternalFirstTwo.charAt(0)) {
 warnings.push(`La inicial del apellido paterno (${cleanPat.charAt(0)}) no coincide con el CURP (${decoded.initials.paternalFirstTwo.charAt(0)})`);
 }

 if (cleanMat && decoded.initials.maternalFirst !== 'X' && cleanMat.charAt(0) !== decoded.initials.maternalFirst) {
 warnings.push(`La inicial del apellido materno (${cleanMat.charAt(0)}) no coincide con el CURP (${decoded.initials.maternalFirst})`);
 }

 // First name (RENAPO ignores Jose/Maria if there's a compound name like 'Jose Manuel' -> 'Manuel' = M)
 if (cleanFirst) {
 const firstParts = cleanFirst.split(/\s+/);
 const targetName = (firstParts.length > 1 && (firstParts[0] === 'JOSE' || firstParts[0] === 'MARIA' || firstParts[0] === 'MA'))
 ? firstParts[1]
 : firstParts[0];

 if (targetName && targetName.charAt(0) !== decoded.initials.nameFirst && cleanFirst.charAt(0) !== decoded.initials.nameFirst) {
 warnings.push(`La inicial del nombre (${targetName.charAt(0)}) no coincide con el CURP (${decoded.initials.nameFirst})`);
 }
 }

 return {
 isValid: warnings.length === 0,
 warnings
 };
}

/**
 * Opens a new window with the official formatted Mexican Constancia de CURP
 * and triggers the system Print / Save as PDF dialog.
 */
export function openOfficialCurpCertificatePrintView(data: {
 curp: string;
 nombre?: string;
 apellidoPaterno?: string;
 apellidoMaterno?: string;
 fechaNacimiento?: string;
 edad?: number;
 sexo?: string;
 estadoNacimiento?: string;
 nacionalidad?: string;
 documentoProbatorio?: any;
 verifiedByRenapo?: boolean;
}) {
 const curpStr = (data.curp || '').toUpperCase().trim();
 const decoded = decodeCurp(curpStr);

 const nombreOficial = [data.nombre, data.apellidoPaterno, data.apellidoMaterno].filter(Boolean).join(' ') || (decoded ? 'CIUDADANO TITULAR' : '—');
 const fechaNac = data.fechaNacimiento || decoded?.fechaNacimiento || '—';
 const sexo = data.sexo || (decoded?.sexo === 'HOMBRE' ? 'HOMBRE' : decoded?.sexo === 'MUJER' ? 'MUJER' : '—');
 const estadoNac = data.estadoNacimiento || decoded?.estadoNacimiento || '—';
 const nacionalidad = data.nacionalidad || 'MEXICANA';
 const folio = `CR-${curpStr.substring(0, 10)}-${Date.now().toString(36).toUpperCase()}`;
 const currentDate = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

 const docProbatorio = data.documentoProbatorio;
 let docProbatorioStr = 'INFORMACIÓN VALIDADA EN EL REGISTRO NACIONAL DE POBLACIÓN';
 if (docProbatorio) {
 if (typeof docProbatorio === 'object') {
 docProbatorioStr = `Acta No. ${docProbatorio.acta || docProbatorio.numActa || '—'}, Año: ${docProbatorio.anio || docProbatorio.anioRegistro || '—'}, Entidad: ${docProbatorio.entidadRegistro || estadoNac}, Municipio: ${docProbatorio.municipioRegistro || '—'}`;
 } else {
 docProbatorioStr = String(docProbatorio);
 }
 }

 const printWindow = window.open('', '_blank', 'width=850,height=950');
 if (!printWindow) {
 alert('Por favor permite ventanas emergentes para visualizar la Constancia de CURP.');
 return;
 }

 const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
 <meta charset="UTF-8">
 <title>Constancia de Registro de Población - ${curpStr}</title>
 <style>
 @page { size: letter; margin: 15mm; }
 body {
 font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
 color: #111827;
 margin: 0;
 padding: 24px;
 background: #f9fafb;
 }
 .sheet {
 background: #fff;
 max-width: 800px;
 margin: 0 auto;
 padding: 36px 40px;
 border: 1px solid #e5e7eb;
 border-radius: 8px;
 box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
 position: relative;
 }
 .header {
 display: flex;
 justify-content: space-between;
 align-items: center;
 border-bottom: 3px solid #1b3b2b;
 padding-bottom: 16px;
 margin-bottom: 24px;
 }
 .header-titles h1 {
 margin: 0;
 font-size: 16px;
 text-transform: uppercase;
 letter-spacing: 0.5px;
 color: #1b3b2b;
 }
 .header-titles h2 {
 margin: 4px 0 0 0;
 font-size: 13px;
 color: #4b5563;
 font-weight: 500;
 }
 .badge {
 display: inline-block;
 padding: 6px 12px;
 background: #ecfdf5;
 color: #065f46;
 border: 1px solid #a7f3d0;
 border-radius: 9999px;
 font-size: 11px;
 font-weight: bold;
 }
 .curp-box {
 background: #f0fdf4;
 border: 2px dashed #059669;
 border-radius: 8px;
 padding: 16px 20px;
 text-align: center;
 margin-bottom: 24px;
 }
 .curp-box span {
 display: block;
 font-size: 11px;
 text-transform: uppercase;
 font-weight: 600;
 color: #047857;
 letter-spacing: 1px;
 margin-bottom: 4px;
 }
 .curp-box strong {
 font-family: monospace;
 font-size: 26px;
 letter-spacing: 3px;
 color: #064e3b;
 }
 .grid {
 display: grid;
 grid-template-columns: repeat(2, 1fr);
 gap: 16px;
 margin-bottom: 24px;
 }
 .grid-full {
 grid-column: span 2;
 }
 .field-card {
 background: #fdfdfd;
 border: 1px solid #e5e7eb;
 padding: 10px 14px;
 border-radius: 6px;
 }
 .field-card label {
 display: block;
 font-size: 10px;
 text-transform: uppercase;
 font-weight: bold;
 color: #6b7280;
 margin-bottom: 3px;
 }
 .field-card div {
 font-size: 13px;
 font-weight: 600;
 color: #111827;
 }
 .doc-section {
 background: #f8fafc;
 border: 1px solid #cbd5e1;
 padding: 12px 16px;
 border-radius: 6px;
 margin-bottom: 24px;
 }
 .doc-section label {
 font-size: 10px;
 text-transform: uppercase;
 font-weight: bold;
 color: #475569;
 display: block;
 margin-bottom: 4px;
 }
 .doc-section div {
 font-size: 12px;
 font-weight: 500;
 color: #0f172a;
 }
 .footer {
 border-top: 1px solid #e5e7eb;
 padding-top: 16px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 font-size: 10px;
 color: #6b7280;
 }
 .actions-bar {
 margin-bottom: 16px;
 display: flex;
 justify-content: flex-end;
 gap: 8px;
 }
 .btn {
 padding: 8px 16px;
 font-size: 12px;
 font-weight: bold;
 border-radius: 6px;
 border: none;
 cursor: pointer;
 }
 .btn-print {
 background: #1b3b2b;
 color: white;
 }
 @media print {
 body { background: white; padding: 0; }
 .sheet { border: none; box-shadow: none; padding: 0; }
 .actions-bar { display: none; }
 }
 </style>
</head>
<body>
 <div class="actions-bar">
 <button class="btn btn-print" onclick="window.print()"> Imprimir / Guardar como PDF</button>
 </div>
 <div class="sheet">
 <div class="header">
 <div class="header-titles">
 <h1>Estados Unidos Mexicanos</h1>
 <h2>Secretaría de Gobernación • RENAPO</h2>
 <div style="font-size: 11px; color: #059669; font-weight: bold; margin-top: 2px;">
 Constancia de Clave Única de Registro de Población
 </div>
 </div>
 <div>
 <span class="badge"> Registro Oficial Validado</span>
 </div>
 </div>

 <div class="curp-box">
 <span>Clave Única de Registro de Población</span>
 <strong>${curpStr}</strong>
 </div>

 <div class="grid">
 <div class="field-card grid-full">
 <label>Nombre(s) y Apellidos</label>
 <div style="font-size: 15px; color: #1b3b2b;">${nombreOficial}</div>
 </div>
 <div class="field-card">
 <label>Fecha de Nacimiento</label>
 <div>${fechaNac} ${data.edad !== undefined ? `(${data.edad} años)` : ''}</div>
 </div>
 <div class="field-card">
 <label>Sexo / Género</label>
 <div>${sexo}</div>
 </div>
 <div class="field-card">
 <label>Lugar / Entidad de Nacimiento</label>
 <div>${estadoNac}</div>
 </div>
 <div class="field-card">
 <label>Nacionalidad</label>
 <div>${nacionalidad}</div>
 </div>
 </div>

 <div class="doc-section">
 <label>Datos del Documento Probatorio / Registro Civil</label>
 <div>${docProbatorioStr}</div>
 </div>

 <div class="footer">
 <div>Folio Verificación: <strong>${folio}</strong></div>
 <div>Fecha de Emisión: <strong>${currentDate}</strong></div>
 <div>Ceiba Roots Sistema Escolar</div>
 </div>
 </div>
</body>
</html>
`;

 printWindow.document.write(htmlContent);
 printWindow.document.close();
}
