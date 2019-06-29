import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css'

async function startApp(tabs) {
    ReactDOM.render(null, document.querySelector('#app'));
}

chrome.tabs.query({
    active: true,
    currentWindow: true
}, startApp);