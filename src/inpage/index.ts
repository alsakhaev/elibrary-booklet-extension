
import { Ref, RefMain, RefDetail } from './types';
import { parseCollection, parseById } from './parser';
import { injectButton } from './injector';
import { generateBooklet } from './booklet';
import { delay } from '../utils/helpers';

const bookletButton = injectButton('Создать буклет');
bookletButton.onclick = () => createBooklet();

async function createBooklet() {

    bookletButton.setLinkDisabled(true);
    bookletButton.setLinkLoading(true);

    const mainPublications = await parseCollection();

    const detailPublications : RefDetail[] = [];

    for (const pub of mainPublications) {
        bookletButton.setLabel(`Загрузка ${detailPublications.length}/${mainPublications.length}`);
        const details = await parseById(pub.id);
        detailPublications.push(details);
        await delay(2000);
    }

    const merged : Ref[] = mainPublications.map(p => ({
        id: p.id,
        main: p,
        details: detailPublications.find(ep => ep.id == p.id)
    }));

    bookletButton.setLinkDisabled(false);
    bookletButton.setLinkLoading(false);
    bookletButton.setLabel('Создать буклет');

    console.log(merged);
    await generateBooklet(merged);
}
