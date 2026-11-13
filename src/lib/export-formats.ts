export type ExportFormat = "txt" | "pdf" | "docx" | "csv" | "srt" | "vtt";

export type ExportSegment = {
  start_ms?: number | null;
  end_ms?: number | null;
  text: string;
};

export type ExportInput = {
  title: string;
  text: string;
  segments?: ExportSegment[];
  includeTimestamps?: boolean;
};

const MIME: Record<ExportFormat, string> = {
  txt: "text/plain; charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  csv: "text/csv; charset=utf-8",
  srt: "application/x-subrip; charset=utf-8",
  vtt: "text/vtt; charset=utf-8",
};

export function mimeFor(format: ExportFormat) {
  return MIME[format];
}

export function filenameFor(title: string, format: ExportFormat) {
  const base = (title || "transcript").replace(/[^\w.-]+/g, "_") || "transcript";
  return `${base}.${format}`;
}

function paragraphs(text: string) {
  return text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function segmentsOrParagraphs(input: ExportInput): ExportSegment[] {
  if (input.segments && input.segments.length > 0) {
    return input.segments.map((s) => ({
      start_ms: s.start_ms ?? null,
      end_ms: s.end_ms ?? null,
      text: s.text.trim(),
    })).filter((s) => s.text);
  }
  const paras = paragraphs(input.text);
  return paras.map((text, i) => ({
    start_ms: i * 5000,
    end_ms: i * 5000 + 4500,
    text,
  }));
}

function pad2(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function pad3(n: number) {
  return String(Math.floor(n)).padStart(3, "0");
}

function formatSrtTime(ms: number) {
  const total = Math.max(0, Math.floor(ms));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const milli = total % 1000;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(milli)}`;
}

function formatVttTime(ms: number) {
  return formatSrtTime(ms).replace(",", ".");
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

export function buildTxt(input: ExportInput) {
  const segs = segmentsOrParagraphs(input);
  if (!input.includeTimestamps) {
    return input.text || segs.map((s) => s.text).join("\n\n");
  }
  return segs
    .map((s) => {
      const stamp =
        s.start_ms != null ? `[${formatClock(s.start_ms)}] ` : "";
      return `${stamp}${s.text}`;
    })
    .join("\n\n");
}

export function buildCsv(input: ExportInput) {
  const segs = segmentsOrParagraphs(input);
  const rows = [["index", "start", "end", "text"]];
  segs.forEach((s, i) => {
    rows.push([
      String(i + 1),
      s.start_ms != null ? formatClock(s.start_ms) : "",
      s.end_ms != null ? formatClock(s.end_ms) : "",
      `"${s.text.replace(/"/g, '""')}"`,
    ]);
  });
  return rows.map((r) => r.join(",")).join("\n");
}

export function buildSrt(input: ExportInput) {
  const segs = segmentsOrParagraphs(input);
  return segs
    .map((s, i) => {
      const start = formatSrtTime(s.start_ms ?? i * 5000);
      const end = formatSrtTime(s.end_ms ?? i * 5000 + 4500);
      return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
    })
    .join("\n");
}

export function buildVtt(input: ExportInput) {
  const segs = segmentsOrParagraphs(input);
  const body = segs
    .map((s, i) => {
      const start = formatVttTime(s.start_ms ?? i * 5000);
      const end = formatVttTime(s.end_ms ?? i * 5000 + 4500);
      return `${start} --> ${end}\n${s.text}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

/** Minimal single-page PDF with Helvetica text lines. */
export function buildPdf(input: ExportInput): Uint8Array {
  const lines = buildTxt(input).split(/\n/);
  const escaped = lines.map((line) =>
    line
      .slice(0, 110)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)"),
  );

  const contentLines = [
    "BT",
    "/F1 11 Tf",
    "50 780 Td",
    "14 TL",
    `(${(input.title || "Transcript").replace(/[\\()]/g, "")}) Tj`,
    "T*",
    "T*",
  ];
  for (const line of escaped) {
    contentLines.push(`(${line || " "}) Tj`, "T*");
  }
  contentLines.push("ET");
  const stream = contentLines.join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n",
  );
  objects.push(
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
  );
  objects.push(
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

/** Minimal DOCX (OOXML) with plain paragraphs. */
export function buildDocx(input: ExportInput): Uint8Array {
  const paras = buildTxt(input)
    .split(/\n/)
    .map(
      (line) =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line || " ")}</w:t></w:r></w:p>`,
    )
    .join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(input.title || "Transcript")}</w:t></w:r></w:p>
    ${paras}
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  return zipStore([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: rels },
    { name: "word/document.xml", data: documentXml },
  ]);
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildFormat(
  format: ExportFormat,
  input: ExportInput,
): Uint8Array | string {
  switch (format) {
    case "txt":
      return buildTxt(input);
    case "csv":
      return buildCsv(input);
    case "srt":
      return buildSrt(input);
    case "vtt":
      return buildVtt(input);
    case "pdf":
      return buildPdf(input);
    case "docx":
      return buildDocx(input);
  }
}

/** Uncompressed ZIP (store) for multi-format downloads. */
export function zipStore(
  files: { name: string; data: string | Uint8Array }[],
): Uint8Array {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const data =
      typeof file.data === "string"
        ? new TextEncoder().encode(file.data)
        : file.data;
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    chunks.push(local, data);

    const cen = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    cen.set(nameBytes, 46);
    central.push(cen);
    offset += local.length + data.length;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const total =
    offset + centralSize + end.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  for (const c of central) {
    out.set(c, p);
    p += c.length;
  }
  out.set(end, p);
  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
