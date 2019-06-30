import { Ref } from './types';
import { saveAs } from 'file-saver';
import * as docx from 'docx';


export async function generateBooklet(refs: Ref[]) {

    // Create document
    const doc = new docx.Document();

    for (const ref of refs) {
        const authorsRun = new docx.TextRun(ref.main.authors);
        authorsRun.bold();

        const authorsParagraph = new docx.Paragraph();
        authorsParagraph.addRun(authorsRun);

        const titleText = ref.main.title + ' / ' + ref.main.authors + ' // ' + ref.main.desc;
        const titleParagraph = new docx.Paragraph(titleText);

        // Ключевые слова

        const keywordsTitleRun = new docx.TextRun('Ключевые слова: ');
        keywordsTitleRun.bold();
        keywordsTitleRun.italics();

        const keywordsRun = new docx.TextRun(ref.details.keywords.join(', '));
        keywordsRun.italics();

        const keywordsParagraph = new docx.Paragraph();
        keywordsParagraph.addRun(keywordsTitleRun);
        keywordsParagraph.addRun(keywordsRun);

        // Реферат
        
        const abstractRun = new docx.TextRun(ref.details.abstract);
        abstractRun.italics();

        const abstractParagraph = new docx.Paragraph();
        abstractParagraph.addRun(abstractRun);

        // Разделитель

        const thematicParagraph = new docx.Paragraph();
        thematicParagraph.thematicBreak();
        
        doc.addParagraph(authorsParagraph);
        doc.addParagraph(titleParagraph);
        doc.addParagraph(keywordsParagraph);
        doc.addParagraph(abstractParagraph);
        doc.addParagraph(thematicParagraph);
    }

    const packer = new docx.Packer();
    const buf = await packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buf)]);

    saveAs(blob, "booklet.docx");
}
