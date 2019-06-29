import { RefMain, RefDetail } from './types';
import * as cheerio from 'cheerio';
import * as _ from 'lodash';


export async function parseCollection() : Promise<RefMain[]> {
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

export async function parseById(id: string) : Promise<RefDetail> {
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