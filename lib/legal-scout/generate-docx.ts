import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import type { LegalConclusion } from "./types";

const riskColor: Record<string, string> = {
  high: "C0392B",
  medium: "E67E22",
  low: "27AE60",
};

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}

function body(text: string) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function labelValue(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value, size: 22 }),
    ],
  });
}

export async function generateLegalDocx(conclusion: LegalConclusion): Promise<Buffer> {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: conclusion.conclusion_title, bold: true, size: 36 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
          size: 20,
          color: "666666",
        }),
      ],
    }),
    heading("Executive Summary", HeadingLevel.HEADING_1),
    body(conclusion.executive_summary),
    labelValue("Overall Risk", conclusion.overall_risk.toUpperCase()),
    labelValue("Success Likelihood", conclusion.success_likelihood.toUpperCase()),
    heading("Findings", HeadingLevel.HEADING_1),
  ];

  const tableRows: TableRow[] = [
    new TableRow({
      children: ["#", "Finding", "Risk", "Analysis"].map(
        (h) =>
          new TableCell({
            borders,
            shading: { fill: "2C3E50", type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20 })],
              }),
            ],
          })
      ),
    }),
  ];

  for (const finding of conclusion.findings) {
    const color = riskColor[finding.risk_level] ?? "333333";
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 600, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: String(finding.id), size: 20 })] })],
          }),
          new TableCell({
            borders,
            width: { size: 2200, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: finding.title, bold: true, size: 20 })] })],
          }),
          new TableCell({
            borders,
            width: { size: 1000, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: finding.risk_level.toUpperCase(), bold: true, color, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            borders,
            width: { size: 5560, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: finding.analysis, size: 20 })] })],
          }),
        ],
      })
    );
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...children,
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [600, 2200, 1000, 5560],
            rows: tableRows,
          }),
          heading("Detailed Findings with Citations", HeadingLevel.HEADING_1),
          ...conclusion.findings.flatMap((f) => [
            heading(`${f.id}. ${f.title}`, HeadingLevel.HEADING_2),
            body(f.analysis),
            heading("Document Citations", HeadingLevel.HEADING_2),
            ...f.document_citations.flatMap((c) => [
              labelValue("Location", c.location),
              body(`"${c.excerpt}"`),
            ]),
            heading("Statutory Citations", HeadingLevel.HEADING_2),
            ...f.statute_citations.flatMap((s) => [
              labelValue("Reference", s.reference),
              body(s.full_text),
              labelValue("Source", s.source_url),
            ]),
          ]),
          heading("Recommended Actions", HeadingLevel.HEADING_1),
          ...conclusion.recommended_actions.map(
            (a, i) =>
              new Paragraph({
                numbering: { reference: "numbers", level: 0 },
                spacing: { after: 100 },
                children: [new TextRun({ text: a, size: 22 })],
              })
          ),
          heading("Disclaimer", HeadingLevel.HEADING_1),
          body(conclusion.disclaimer),
        ],
      },
    ],
    numbering: {
      config: [
        {
          reference: "numbers",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
  });

  return Packer.toBuffer(doc);
}
