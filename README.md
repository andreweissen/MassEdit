## MassEdit ##

### Overview ###

__NOTE: This is a personal development repository of an application whose production code is stored on the Dev wiki [here](https://dev.wikia.com/wiki/MassEdit).__

[__MassEdit__](https://dev.wikia.com/wiki/MassEdit) is a task automation and bulk editing tool written in ES5-compliant JavaScript for use on wikis formerly running on Fandom, Inc.'s MediaWiki 1.19 legacy platform and presently running on the MediaWiki 1.33 [Unified Community Platform](https://community.fandom.com/wiki/Help:Unified_Community_Platform). Its development was inspired by a desire to make the bulk editing capabilities of dedicated bot software like [AutoWikiBrowser](https://github.com/reedy/AutoWikiBrowser) and [Pywikibot](https://github.com/wikimedia/pywikibot) and the in-editor capabilities of [FindAndReplace](https://dev.wikia.com/wiki/FindAndReplace) more readily available to the average contributor.

Run as an in-browser application, MassEdit provides users with the ability to automate otherwise tedious editing and upkeep tasks. It can create a new set of pages/templates/categories, add or remove content from existing pages, categorize or recategorize pages in bulk, find-and-replace select content from pages at will, message users, or generate lists of member pages belonging to categories or namespaces. In addition to providing a listing of loose pages, users may also input the names of [categories](https://www.mediawiki.org/wiki/Help:Categories) or [namespaces](https://www.mediawiki.org/wiki/Help:Namespaces) to edit their respective member pages in bulk.

As of its most recent updates, the script employs a number of other external dependencies similarly housed on Dev. In addition to those loaded by default in MediaWiki, MassEdit makes use of [Modal.js](https://dev.wikia.com/wiki/Modal), [Placement.js](https://dev.wikia.com/wiki/Placement), [I18n-js](https://dev.wikia.com/wiki/I18n-js), [Colors.js](https://dev.wikia.com/wiki/Colors), and [wgMessageWallsExist](https://dev.wikia.com/wiki/WgMessageWallsExist) for the purposes of standardizing modal design and providing more widespread [i18n](https://en.wikipedia.org/wiki/Internationalization_and_localization) support.

### Resources ###

* [Documentation](https://dev.wikia.com/wiki/MassEdit)
* [Revision history](https://dev.wikia.com/wiki/MediaWiki:MassEdit/code.js?action=history)
* [Production code (JS)](https://dev.wikia.com/wiki/MediaWiki:MassEdit/code.js)
* [Production code (JSON)](https://dev.wikia.com/wiki/MediaWiki:Custom-MassEdit/i18n.json)