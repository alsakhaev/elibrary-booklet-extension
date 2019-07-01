import { Ref } from './types';
import { saveAs } from 'file-saver';
import * as docx from 'docx';


export async function generateBooklet(refs: Ref[]) {

    // Create document
    const doc = new docx.Document();

    for (const ref of refs) {
        if (ref.main.authors) {
            const authorsRun = new docx.TextRun(ref.main.authors);
            authorsRun.bold();

            const authorsParagraph = new docx.Paragraph();
            authorsParagraph.addRun(authorsRun);
            doc.addParagraph(authorsParagraph);
        }

        if (ref.main.title || ref.main.authors || ref.main.desc) {
            const titleText = ref.main.title + ' / ' + ref.main.authors + ' // ' + ref.main.desc;
            const titleParagraph = new docx.Paragraph(titleText);
            doc.addParagraph(titleParagraph);
        }

        // Ключевые слова
        if (ref.details && ref.details.keywords && ref.details.keywords.length > 0) {
            const keywordsTitleRun = new docx.TextRun('Ключевые слова: ');
            keywordsTitleRun.bold();
            keywordsTitleRun.italics();

            // ToDo: fix undefined error
            const keywordsRun = new docx.TextRun(ref.details.keywords.join(', '));
            keywordsRun.italics();

            const keywordsParagraph = new docx.Paragraph();
            keywordsParagraph.addRun(keywordsTitleRun);
            keywordsParagraph.addRun(keywordsRun);
            doc.addParagraph(keywordsParagraph);
        }

        // Реферат
        if (ref.details && ref.details.abstract) {
            const abstractRun = new docx.TextRun(ref.details.abstract);
            abstractRun.italics();

            const abstractParagraph = new docx.Paragraph();
            abstractParagraph.addRun(abstractRun);
            doc.addParagraph(abstractParagraph);
        }

        // Разделитель
        const thematicParagraph = new docx.Paragraph();
        thematicParagraph.thematicBreak();
        doc.addParagraph(thematicParagraph);
    }

    const packer = new docx.Packer();
    const buf = await packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buf)]);

    saveAs(blob, "booklet.docx");
}
