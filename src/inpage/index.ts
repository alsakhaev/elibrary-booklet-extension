import * as cheerio from 'cheerio';
import * as _ from 'lodash';
import { saveAs } from 'file-saver';
import * as docx from 'docx';

const actionsPanel = document.querySelector('#thepage > table > tbody > tr > td > table > tbody > tr > td:nth-child(4) > table > tbody');
const createBookletHtml =
    `<tr class="ext-booklet">
        <td width="15%" align="right" valign="top">
            <a href="#" id="createBookletIcon">
                <img src="images/but_orange.gif" width="15" height="15" hspace="3" border="0">
            </a>
        </td>
        <td width="85%" align="left" valign="middle">
            <a href="#" id="createBookletLabel">Создать буклет</a>
        </td>
    </tr>`;

actionsPanel.innerHTML = actionsPanel.innerHTML + createBookletHtml;

const createBookletIcon = document.getElementById('createBookletIcon');
const createBookletLabel = document.getElementById('createBookletLabel');

createBookletIcon.onclick = () => createBooklet();
createBookletLabel.onclick = () => createBooklet();

async function createBooklet() {

    setLinkDisabled(true);
    setLinkLoading(true);

    const mainPublications = await parseCollection();
    const detailPublications = await Promise.all(mainPublications.map(p => parseById(p.id)));

    const merged : Ref[] = mainPublications.map(p => ({
        id: p.id,
        main: p,
        details: detailPublications.find(ep => ep.id == p.id)
    }));

    setLinkDisabled(false);
    setLinkLoading(false);

    console.log(merged);
    await generateBooklet(merged);
}

type Ref = {
    id: string,
    main: RefMain,
    details: RefDetail
}

type RefMain = {
    id: string, 
    title: string, 
    authors: string, 
    desc: string
}

async function generateBooklet(refs: Ref[]) {

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

function setLinkDisabled(value: boolean) {
    if (value) {
        createBookletIcon.classList.add('disabled');
        createBookletLabel.classList.add('disabled');
    } else {
        createBookletIcon.classList.remove('disabled');
        createBookletLabel.classList.remove('disabled');
    }
}

function setLinkLoading(value: boolean) {
    if (value) {
        createBookletIcon.querySelector('img').src = chrome.extension.getURL('loadingSpinner.gif');
    } else {
        createBookletIcon.querySelector('img').src = "images/but_orange.gif"
    }
}

async function parseCollection() : Promise<RefMain[]> {
    const publicationTds = document.querySelectorAll('#restab tr[id] td[align=left]');
    const publications = [];

    publicationTds.forEach((td) => {
        publications.push({
            id: /item\.asp\?id=([0-9]*)$/gm.exec(td.getElementsByTagName("a")[0].href)[1],
            title: td.getElementsByTagName("a")[0].innerText,
            authors: td.getElementsByTagName("font")[0].innerText,
            desc: td.getElementsByTagName("font")[1].innerText
        });
    });

    return publications;
}



type RefDetail = {
    id: string,
    authors?: string[],
    title?: string,
    pages?: string,
    issue?: string,
    year?: string,
    tom?: string,
    conf?: string,
    source?: string,
    journal?: string,
    keywords?: string[],
    abstract?: string
}

async function parseById(id: string) : Promise<RefDetail> {
    const response = await fetch("https://elibrary.ru/item.asp?id=" + id);
    if (!response.ok) {
        throw new Error("Ошибка загрузки статьи ИД " + id);
    }

    const body = await response.text();

    let $ = cheerio.load(body);

    // parse article title
    var content: RefDetail = {
        id: id,
        authors: [],
        title: $("title").text()
    };

    var capitalizeIfVeryUp = function (text) {
        var reUp = /[A-ZА-ЯЁ]/g;
        var reLow = /[a-zа-яё]/g;
        if ((text.match(reUp) || []).length > (text.match(reLow) || []).length) {
            return _.capitalize(text);
        }

        return text;
    };

    content.title = capitalizeIfVeryUp(content.title);

    // parse authors list
    $("span[style='white-space: nowrap'] b").each(function (index, element) {
        var title = $(element).text();
        var author: any = { title: title };
        var authorElements = title.split(/\s+|\./);
        author.lastName = authorElements[0]
            .split("-")
            .map(_.capitalize)
            .join("-");
        if (authorElements.length > 1) {
            author.firstName = _.capitalize(authorElements[1]);
            author.firstNameInitial = authorElements[1][0];
            if (authorElements.length > 2) {
                author.extraName = _.capitalize(authorElements[2]);
                author.extraNameInitial = authorElements[2][0];
            }
        }
        content.authors.push(author);
    });

    // parse source params
    var sourceParamsContent = "";
    $('td[width="574"]').each(function (index, element) {
        sourceParamsContent += $(element).text();
    });

    var pagesRe = /Страницы\:\s*(\d+(\-\d+)?)/m;
    var pagesResult = pagesRe.exec(sourceParamsContent);
    if (pagesResult && pagesResult.length > 1) {
        content.pages = pagesResult[1];
    }

    var issueRe = /Номер:\s*(.*)\n/m;
    var issueResult = issueRe.exec(sourceParamsContent);
    if (issueResult && issueResult.length > 1) {
        content.issue = issueResult[1];
    }

    var yearRe = /(Год|Годы|Год издания):\s*(.*)\n/m;
    var yearResult = yearRe.exec(sourceParamsContent);
    if (yearResult && yearResult.length > 1) {
        content.year = yearResult[2];
    }

    var tomRe = /(Том):\s*(.*)\n/m;
    var tomResult = tomRe.exec(sourceParamsContent);
    if (tomResult && tomResult.length > 1) {
        content.tom = tomResult[2];
    }

    var chapters = $(
        'div[style="width:580px; margin:0; border:0; padding:0; "] table'
    ).toArray();

    // конференция
    chapters
        .filter(function (x) {
            return (/(КОНФЕРЕНЦИЯ:)/m.exec($(x).text()) || []).length > 0;
        })
        .forEach(function (x) {
            content.conf = capitalizeIfVeryUp(
                $("td[valign] font", x)
                    .first()
                    .text()
                    .trim()
            );
        });

    // источник
    chapters
        .filter(function (x) {
            return (/(ИСТОЧНИК:)/m.exec($(x).text()) || []).length > 0;
        })
        .forEach(function (x) {
            content.source = capitalizeIfVeryUp(
                $("td[valign] a", x)
                    .first()
                    .text()
                    .trim()
            );
        });

    // журнал
    chapters
        .filter(function (x) {
            return (/(ЖУРНАЛ:)/m.exec($(x).text()) || []).length > 0;
        })
        .forEach(function (x) {
            content.journal = capitalizeIfVeryUp(
                $("td[valign] a", x)
                    .first()
                    .text()
                    .trim()
            );
        });

    // ключ слова
    chapters
        .filter(function (x) {
            return (/(КЛЮЧЕВЫЕ СЛОВА:)/m.exec($(x).text()) || []).length > 0;
        })
        .forEach(function (x) {
            content.keywords = [];
            $("td[valign] a", x).each(function (a) {
                content.keywords.push(
                    $(this)
                        .text()
                        .trim()
                        .toLowerCase()
                );
            });
        });

    content.abstract = $("#abstract1").text();

    return content;
}