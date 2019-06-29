import { Ref } from './types';
import { saveAs } from 'file-saver';
import * as docx from 'docx';


export async function generateBooklet(refs: Ref[]) {

    // Create document
    const doc = new docx.Document();

    for (const ref of refs) {
        const paragraph = new docx.Paragraph(ref.main.authors);
        doc.addParagraph(paragraph);
    }

    const packer = new docx.Packer();
    const buf = await packer.toBuffer(doc);
    const blob = new Blob([new Uint8Array(buf)]);

    saveAs(blob, "booklet.docx");
}
