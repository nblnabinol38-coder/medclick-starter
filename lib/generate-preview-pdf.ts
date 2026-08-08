import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";

export type PreviewMedication = {
  position: number;
  name: string;
  dosage: string;
  pharmaceuticalForm: string;
  boxQuantity: number;
  instructions: string;
};

export type PreviewPdfInput = {
  documentNumber: string;
  verificationCode: string;
  verificationQrCode: string;

  documentType: "MEDICAL_CERTIFICATE" | "PRESCRIPTION" | "MEDICAL_REPORT";
  unitType: "UPA" | "UNIMED";
  unitName: string;

  patientName: string;
  patientCpf: string;
  patientBirthDate: Date;
  patientMotherName: string;
  patientAddress: string;
  patientCity?: string | null;
  patientState?: string | null;
  patientPostalCode?: string | null;

  cid?: string | null;
  certificateDays?: number | null;
  reportPurpose?: string | null;
  reportDescription?: string | null;
  symptoms: string;
  medications: PreviewMedication[];

  doctorName: string;
  doctorCrm?: string | null;
  doctorCrmState?: string | null;

  createdAt: Date;
};

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
};

const A4: [number, number] = [595.28, 841.89];
const BLACK = rgb(0.08, 0.1, 0.13);
const MUTED = rgb(0.35, 0.39, 0.45);
const LINE = rgb(0.77, 0.8, 0.84);
const LIGHT = rgb(0.96, 0.97, 0.98);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.0, 0.55, 0.34);
const TEAL = rgb(0.0, 0.55, 0.52);
const RED = rgb(0.9, 0.15, 0.15);
const NAVY = rgb(0.08, 0.12, 0.2);

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const cpf = onlyNumbers(value);
  if (cpf.length !== 11) return value;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatLongDate(date: Date) {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

const DAYS = [
  "ZERO",
  "UM",
  "DOIS",
  "TRÊS",
  "QUATRO",
  "CINCO",
  "SEIS",
  "SETE",
  "OITO",
  "NOVE",
  "DEZ",
  "ONZE",
  "DOZE",
  "TREZE",
  "QUATORZE",
  "QUINZE",
  "DEZESSEIS",
  "DEZESSETE",
  "DEZOITO",
  "DEZENOVE",
  "VINTE",
  "VINTE E UM",
  "VINTE E DOIS",
  "VINTE E TRÊS",
  "VINTE E QUATRO",
  "VINTE E CINCO",
  "VINTE E SEIS",
  "VINTE E SETE",
  "VINTE E OITO",
  "VINTE E NOVE",
  "TRINTA",
];

function daysWord(days: number) {
  return DAYS[days] ?? String(days);
}

function base64Png(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) throw new Error("QR Code PNG inválido.");
  return Buffer.from(match[1], "base64");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = text.split(/\n/);
  const output: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (!words.length) {
      output.push("");
      continue;
    }

    let line = words[0];

    for (const word of words.slice(1)) {
      const next = `${line} ${word}`;

      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
      } else {
        output.push(line);
        line = word;
      }
    }

    output.push(line);
  }

  return output;
}

function drawWrapped(
  page: PDFPage,
  text: string,
  font: PDFFont,
  options: {
    x: number;
    y: number;
    size: number;
    maxWidth: number;
    lineHeight?: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const lines = wrapText(text, font, options.size, options.maxWidth);
  const lineHeight = options.lineHeight ?? options.size * 1.3;
  let y = options.y;

  for (const line of lines) {
    page.drawText(line, {
      x: options.x,
      y,
      size: options.size,
      font,
      color: options.color ?? BLACK,
    });
    y -= lineHeight;
  }

  return y;
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color = BLACK,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (page.getWidth() - width) / 2,
    y,
    size,
    font,
    color,
  });
}

function drawLine(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 0.7,
  color = LINE,
) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color,
  });
}

function drawPreviewWatermark(page: PDFPage, fonts: Fonts) {
  page.drawText("PRÉVIA", {
    x: 105,
    y: 355,
    size: 82,
    font: fonts.bold,
    color: RED,
    opacity: 0.12,
    rotate: degrees(33),
  });
}

function drawPreviewRibbon(page: PDFPage, fonts: Fonts) {
  page.drawRectangle({
    x: 0,
    y: A4[1] - 24,
    width: A4[0],
    height: 24,
    color: NAVY,
  });

  page.drawText("MEDCLICK • PRÉVIA DO DOCUMENTO • SEM VALIDADE", {
    x: 22,
    y: A4[1] - 16.5,
    size: 8.5,
    font: fonts.bold,
    color: WHITE,
  });
}

function drawField(
  page: PDFPage,
  fonts: Fonts,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height = 38,
) {
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: LINE,
    borderWidth: 0.7,
    color: WHITE,
  });

  page.drawText(label.toUpperCase(), {
    x: x + 8,
    y: y - 12,
    size: 6.6,
    font: fonts.bold,
    color: MUTED,
  });

  drawWrapped(page, value || "—", fonts.regular, {
    x: x + 8,
    y: y - 26,
    size: 8.3,
    maxWidth: width - 16,
    lineHeight: 9.5,
  });
}

async function drawVerificationBlock(
  page: PDFPage,
  pdf: PDFDocument,
  fonts: Fonts,
  input: PreviewPdfInput,
  x: number,
  y: number,
  width: number,
) {
  const qr = await pdf.embedPng(base64Png(input.verificationQrCode));

  page.drawRectangle({
    x,
    y,
    width,
    height: 98,
    borderColor: LINE,
    borderWidth: 0.8,
    color: LIGHT,
  });

  page.drawImage(qr, {
    x: x + 10,
    y: y + 10,
    width: 78,
    height: 78,
  });

  page.drawText("MEDCLICK", {
    x: x + 100,
    y: y + 76,
    size: 10,
    font: fonts.bold,
    color: TEAL,
  });

  page.drawText("PRÉVIA DO DOCUMENTO", {
    x: x + 100,
    y: y + 60,
    size: 8.5,
    font: fonts.bold,
    color: BLACK,
  });

  drawWrapped(
    page,
    "Este QR Code ainda não está ativo. Após a confirmação do pagamento, o documento poderá seguir para autenticação.",
    fonts.regular,
    {
      x: x + 100,
      y: y + 45,
      size: 7,
      maxWidth: width - 112,
      lineHeight: 8.3,
      color: MUTED,
    },
  );

  page.drawText(`Código: ${input.verificationCode}`, {
    x: x + 100,
    y: y + 9,
    size: 6.7,
    font: fonts.bold,
    color: MUTED,
  });
}

function drawDoctorApprovalBlock(
  page: PDFPage,
  fonts: Fonts,
  input: PreviewPdfInput,
  y: number,
) {
  const width = 260;
  const x = (A4[0] - width) / 2;

  drawLine(page, x, y, x + width, y, 0.8, MUTED);

  drawCentered(
    page,
    input.doctorName.toUpperCase(),
    fonts.bold,
    9,
    y - 17,
  );

  const crmState = input.doctorCrmState ?? "—";
  drawCentered(
    page,
    `CRM ${input.doctorCrm ?? "—"}/${crmState}`,
    fonts.regular,
    8,
    y - 31,
    MUTED,
  );

  drawCentered(
    page,
    "Assinatura médica após autenticação",
    fonts.regular,
    7,
    y - 46,
    MUTED,
  );
}

function drawFooter(
  page: PDFPage,
  fonts: Fonts,
  input: PreviewPdfInput,
  label: string,
) {
  drawLine(page, 26, 38, A4[0] - 26, 38, 0.7, LINE);

  page.drawText(
    `MedClick • ${label} • ${input.documentNumber} • Gerado em ${formatDateTime(
      input.createdAt,
    )}`,
    {
      x: 28,
      y: 23,
      size: 6.5,
      font: fonts.regular,
      color: MUTED,
    },
  );

  page.drawText("PRÉVIA — SEM VALIDADE", {
    x: A4[0] - 135,
    y: 23,
    size: 6.5,
    font: fonts.bold,
    color: RED,
  });
}

function drawUnimedHeader(page: PDFPage, fonts: Fonts, unitName: string) {
  page.drawText("Unimed", {
    x: 30,
    y: 782,
    size: 23,
    font: fonts.bold,
    color: GREEN,
  });

  page.drawText(unitName || "UNIMED", {
    x: 155,
    y: 790,
    size: 10,
    font: fonts.bold,
    color: BLACK,
  });

  page.drawText("Documento médico digital", {
    x: 155,
    y: 777,
    size: 7.5,
    font: fonts.regular,
    color: MUTED,
  });
}

function drawUpaHeader(page: PDFPage, fonts: Fonts, unitName: string) {
  page.drawText("UPA24h", {
    x: 30,
    y: 782,
    size: 25,
    font: fonts.bold,
    color: GREEN,
  });

  page.drawText("UNIDADE DE PRONTO ATENDIMENTO", {
    x: 30,
    y: 765,
    size: 7.2,
    font: fonts.bold,
    color: MUTED,
  });

  drawWrapped(page, unitName || "Unidade informada", fonts.bold, {
    x: 330,
    y: 790,
    size: 9.2,
    maxWidth: 230,
    lineHeight: 11,
  });
}

async function renderUnimedCertificate(
  pdf: PDFDocument,
  input: PreviewPdfInput,
  fonts: Fonts,
) {
  const page = pdf.addPage(A4);
  drawPreviewRibbon(page, fonts);
  drawUnimedHeader(page, fonts, input.unitName);

  const top = 746;
  page.drawRectangle({
    x: 28,
    y: 676,
    width: A4[0] - 56,
    height: 64,
    borderColor: MUTED,
    borderWidth: 0.8,
    color: WHITE,
  });

  drawField(page, fonts, "Nome do paciente", input.patientName, 36, top - 4, 250, 28);
  drawField(page, fonts, "CPF", formatCpf(input.patientCpf), 294, top - 4, 118, 28);
  drawField(page, fonts, "Nascimento", formatDate(input.patientBirthDate), 420, top - 4, 132, 28);

  drawField(
    page,
    fonts,
    "Nome da mãe",
    input.patientMotherName,
    36,
    top - 36,
    250,
    28,
  );
  drawField(
    page,
    fonts,
    "Profissional",
    input.doctorName,
    294,
    top - 36,
    258,
    28,
  );

  drawCentered(page, "ATESTADO MÉDICO", fonts.bold, 14, 640);
  drawLine(page, 28, 628, A4[0] - 28, 628, 0.8, MUTED);

  const days = input.certificateDays ?? 1;
  const text =
    `Atesto para os devidos fins que ${input.patientName.toUpperCase()}, ` +
    `inscrito(a) no CPF sob o nº ${formatCpf(input.patientCpf)}, foi atendido(a) ` +
    `em ${formatDate(input.createdAt)} às ${formatTime(input.createdAt)}. ` +
    `${input.symptoms.trim() ? `Motivo informado: ${input.symptoms.trim()}. ` : ""}` +
    `Foi solicitado afastamento por ${days} (${daysWord(days)}) dia(s).`;

  let y = drawWrapped(page, text, fonts.regular, {
    x: 36,
    y: 598,
    size: 10.3,
    maxWidth: A4[0] - 72,
    lineHeight: 14,
  });

  if (input.cid?.trim()) {
    y = drawWrapped(
      page,
      `CID informado: ${input.cid.trim().toUpperCase()}.`,
      fonts.bold,
      {
        x: 36,
        y: y - 10,
        size: 10,
        maxWidth: A4[0] - 72,
        lineHeight: 13,
      },
    );
  }

  drawWrapped(
    page,
    `Unidade: ${input.unitName}. Documento em prévia administrativa, sujeito à revisão e autenticação do profissional responsável.`,
    fonts.regular,
    {
      x: 36,
      y: y - 18,
      size: 8.2,
      maxWidth: A4[0] - 72,
      lineHeight: 10.5,
      color: MUTED,
    },
  );

  drawDoctorApprovalBlock(page, fonts, input, 355);
  await drawVerificationBlock(page, pdf, fonts, input, 55, 105, A4[0] - 110);
  drawFooter(page, fonts, input, "Atestado Unimed");
  drawPreviewWatermark(page, fonts);
}

async function renderUpaCertificate(
  pdf: PDFDocument,
  input: PreviewPdfInput,
  fonts: Fonts,
) {
  const page = pdf.addPage(A4);
  drawPreviewRibbon(page, fonts);
  drawUpaHeader(page, fonts, input.unitName);

  drawLine(page, 28, 748, A4[0] - 28, 748, 0.8, MUTED);
  drawCentered(page, "ATESTADO MÉDICO", fonts.bold, 15, 722);
  drawLine(page, 28, 710, A4[0] - 28, 710, 0.8, MUTED);

  page.drawText(`PARA: ${input.patientName.toUpperCase()}`, {
    x: 72,
    y: 665,
    size: 13,
    font: fonts.regular,
    color: BLACK,
  });

  const days = input.certificateDays ?? 1;
  const body =
    `Atesto para os devidos fins que ${input.patientName.toUpperCase()}, ` +
    `CPF ${formatCpf(input.patientCpf)}, foi atendido(a) na unidade ${input.unitName} ` +
    `em ${formatDate(input.createdAt)} às ${formatTime(input.createdAt)}, ` +
    `necessitando de ${days} (${daysWord(days)}) dia(s) de afastamento.`;

  drawWrapped(page, body, fonts.regular, {
    x: 36,
    y: 620,
    size: 11.5,
    maxWidth: A4[0] - 72,
    lineHeight: 15,
  });

  page.drawText(`CID: ${input.cid?.trim().toUpperCase() || "—"}`, {
    x: 36,
    y: 455,
    size: 14,
    font: fonts.regular,
    color: BLACK,
  });

  page.drawText(
    `${input.unitName}, ${formatLongDate(input.createdAt)}`,
    {
      x: 305,
      y: 435,
      size: 10.5,
      font: fonts.regular,
      color: BLACK,
    },
  );

  drawDoctorApprovalBlock(page, fonts, input, 315);
  await drawVerificationBlock(page, pdf, fonts, input, 52, 92, A4[0] - 104);
  drawFooter(page, fonts, input, "Atestado UPA24h");
  drawPreviewWatermark(page, fonts);
}

async function renderUnimedPrescription(
  pdf: PDFDocument,
  input: PreviewPdfInput,
  fonts: Fonts,
) {
  const page = pdf.addPage(A4);
  drawPreviewRibbon(page, fonts);
  drawUnimedHeader(page, fonts, input.unitName);

  drawField(page, fonts, "Paciente", input.patientName, 28, 742, 260, 42);
  drawField(page, fonts, "CPF", formatCpf(input.patientCpf), 296, 742, 122, 42);
  drawField(page, fonts, "Nascimento", formatDate(input.patientBirthDate), 426, 742, 141, 42);

  const address = [
    input.patientAddress,
    input.patientCity,
    input.patientState,
    input.patientPostalCode,
  ]
    .filter(Boolean)
    .join(", ");

  drawField(page, fonts, "Endereço", address, 28, 694, 539, 42);

  drawCentered(page, "RECEITA MÉDICA", fonts.bold, 14, 625);
  drawLine(page, 28, 612, A4[0] - 28, 612, 0.8, LINE);

  let y = 575;

  const meds = input.medications.length
    ? input.medications
    : [
        {
          position: 1,
          name: "Medicamento não informado",
          dosage: "",
          pharmaceuticalForm: "",
          boxQuantity: 0,
          instructions: "Aguardando preenchimento/revisão do profissional.",
        },
      ];

  for (const medication of meds.slice(0, 6)) {
    const title = [
      medication.name?.toUpperCase(),
      medication.dosage,
      medication.pharmaceuticalForm,
    ]
      .filter(Boolean)
      .join(" ");

    y = drawWrapped(page, title, fonts.bold, {
      x: 36,
      y,
      size: 10.5,
      maxWidth: 370,
      lineHeight: 13,
    });

    y = drawWrapped(page, medication.instructions || "—", fonts.regular, {
      x: 36,
      y: y - 2,
      size: 9.3,
      maxWidth: 370,
      lineHeight: 11.5,
    });

    const quantity =
      medication.boxQuantity > 0
        ? `${medication.boxQuantity} caixa${
            medication.boxQuantity === 1 ? "" : "s"
          }`
        : "—";

    page.drawText(quantity, {
      x: 440,
      y: y + 12,
      size: 9.5,
      font: fonts.bold,
      color: BLACK,
    });

    y -= 24;

    if (y < 230) break;
  }

  drawDoctorApprovalBlock(page, fonts, input, 195);
  await drawVerificationBlock(page, pdf, fonts, input, 52, 68, A4[0] - 104);
  drawFooter(page, fonts, input, "Receita Unimed");
  drawPreviewWatermark(page, fonts);
}

async function renderMedicalReport(
  pdf: PDFDocument,
  input: PreviewPdfInput,
  fonts: Fonts,
) {
  const page = pdf.addPage(A4);
  drawPreviewRibbon(page, fonts);

  if (input.unitType === "UNIMED") {
    drawUnimedHeader(page, fonts, input.unitName);
  } else {
    drawUpaHeader(page, fonts, input.unitName);
  }

  drawField(page, fonts, "Paciente", input.patientName, 28, 742, 270, 40);
  drawField(page, fonts, "CPF", formatCpf(input.patientCpf), 306, 742, 126, 40);
  drawField(page, fonts, "Nascimento", formatDate(input.patientBirthDate), 440, 742, 127, 40);

  drawCentered(page, "LAUDO MÉDICO", fonts.bold, 14, 650);
  drawLine(page, 28, 638, A4[0] - 28, 638, 0.8, LINE);

  let y = 605;

  if (input.cid?.trim()) {
    y = drawWrapped(page, `CID: ${input.cid.trim().toUpperCase()}`, fonts.bold, {
      x: 36,
      y,
      size: 10,
      maxWidth: A4[0] - 72,
      lineHeight: 13,
    });
    y -= 8;
  }

  const description =
    input.reportDescription?.trim() ||
    input.symptoms.trim() ||
    "Conteúdo clínico aguardando revisão do profissional responsável.";

  y = drawWrapped(page, description, fonts.regular, {
    x: 36,
    y,
    size: 10.2,
    maxWidth: A4[0] - 72,
    lineHeight: 14,
  });

  if (input.reportPurpose?.trim()) {
    y -= 16;
    drawWrapped(
      page,
      `CONCLUSÃO / FINALIDADE: ${input.reportPurpose.trim()}`,
      fonts.bold,
      {
        x: 36,
        y,
        size: 10,
        maxWidth: A4[0] - 72,
        lineHeight: 13,
      },
    );
  }

  drawDoctorApprovalBlock(page, fonts, input, 260);
  await drawVerificationBlock(page, pdf, fonts, input, 52, 82, A4[0] - 104);
  drawFooter(page, fonts, input, "Laudo Médico");
  drawPreviewWatermark(page, fonts);
}

export async function generatePreviewPdf(input: PreviewPdfInput) {
  /*
   * NOVA ARQUITETURA:
   * - não carrega os PDFs antigos;
   * - não usa whiteOut;
   * - não redesenha por cima de template existente;
   * - cria uma página vetorial nova e determinística;
   * - mantém a prévia claramente identificada como SEM VALIDADE.
   */
  const pdf = await PDFDocument.create();

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { regular, bold };

  if (input.documentType === "MEDICAL_CERTIFICATE") {
    if (input.unitType === "UNIMED") {
      await renderUnimedCertificate(pdf, input, fonts);
    } else {
      await renderUpaCertificate(pdf, input, fonts);
    }
  } else if (input.documentType === "PRESCRIPTION") {
    await renderUnimedPrescription(pdf, input, fonts);
  } else {
    await renderMedicalReport(pdf, input, fonts);
  }

  const bytes = await pdf.save();

  const projectRoot = process.cwd();
  const outputDirectory = path.join(
    projectRoot,
    "public",
    "generated",
    "previews",
  );
  const outputPath = path.join(
    outputDirectory,
    `${input.documentNumber}.pdf`,
  );
  const relativePath = `/generated/previews/${input.documentNumber}.pdf`;

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(outputPath, bytes);

  return {
    relativePath,
    mimeType: "application/pdf",
    sizeBytes: bytes.length,
  };
}