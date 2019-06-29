export function injectControls() {
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

    const result = {
        setLinkDisabled,
        setLinkLoading,
        onclick: null
    };
    
    createBookletIcon.onclick = () => result.onclick && result.onclick();
    createBookletLabel.onclick = () => result.onclick && result.onclick();

    return result;
}

export function setLinkDisabled(value: boolean) {
    const createBookletIcon = document.getElementById('createBookletIcon');
    const createBookletLabel = document.getElementById('createBookletLabel');

    if (value) {
        createBookletIcon.classList.add('disabled');
        createBookletLabel.classList.add('disabled');
    } else {
        createBookletIcon.classList.remove('disabled');
        createBookletLabel.classList.remove('disabled');
    }
}

function setLinkLoading(value: boolean) {
    const createBookletIcon = document.getElementById('createBookletIcon');
    if (value) {
        createBookletIcon.querySelector('img').src = chrome.extension.getURL('loadingSpinner.gif');
    } else {
        createBookletIcon.querySelector('img').src = "images/but_orange.gif"
    }
}