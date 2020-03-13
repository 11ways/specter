# Specter

Headless browser wrapper

## Installation

```bash
npm install @11ways/specter
```

## Usage

```js
const Specter = require('@11ways/specter');

let browser = new Specter.Browser(),
    tab = browser.createTab();

await tab.goto('https://stad.gent/');

let url = await tab.evaluate(function() {
	let img = document.querySelector('img');
	return img.src;
});
```