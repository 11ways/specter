## 0.1.2 (WIP)

* Add `Tab#screenshot()` to make a screenshot of the tab
* Add `Tab#setCookie()` & `Tab#setCookies()` to set request cookies
* Add `Tab#setHeader()` & `Tab#setHeaders()` to set request headers
* Add `Tab#setCredentials()` to set HTTP authentication headers
* Improve limiting concurrent executions & render delays
* Add `Crawler#isUrlAllowed(url)` to check if a certain page can be crawled
* Add `Crawler#parameterIsAllowed(parameter)` to see if a parameter can remain in a url
* Add `Crawler#extensionIsAllowed(extension)` to see if the extension of a certain url is allowed to be crawled
* Upgrade `puppeteer` to v5.2.0

## 0.1.1 (2020-03-13)

* Initial release