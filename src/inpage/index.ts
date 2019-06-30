
import { Ref, RefMain, RefDetail } from './types';
import { parseCollection, parseById } from './parser';
import { injectButton } from './injector';
import { generateBooklet } from './booklet';

const bookletButton = injectButton('Создать буклет');
bookletButton.onclick = () => createBooklet();

async function createBooklet() {

    bookletButton.setLinkDisabled(true);
    bookletButton.setLinkLoading(true);

    const mainPublications = await parseCollection();
    const detailPublications = await Promise.all(mainPublications.map(p => parseById(p.id)));

    const merged : Ref[] = mainPublications.map(p => ({
        id: p.id,
        main: p,
        details: detailPublications.find(ep => ep.id == p.id)
    }));

    bookletButton.setLinkDisabled(false);
    bookletButton.setLinkLoading(false);

    console.log(merged);
    await generateBooklet(merged);
}
