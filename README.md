### MassEdit ###

#### Overview ####

[MassEdit](https://dev.wikia.com/w/MassEdit) is a task automation and bulk editing tool written in ES5-compliant JavaScript for use on wikis running Wikia, Inc.'s forked version of MediaWiki 1.19. Its development was inspired by a desire to make the bulk editing capabilities of dedicated bot software like [AutoWikiBrowser](https://github.com/reedy/AutoWikiBrowser) and [Pywikibot](https://github.com/wikimedia/pywikibot) and the in-editor capabilities of [FindAndReplace](https://dev.wikia.com/w/FindAndReplace) more readily available to the average contributor.

Run as an in-browser application, MassEdit provides users with the ability to automate otherwise tedious editing and upkeep tasks. It can create a new set of pages/templates/categories, add or remove content from existing pages, categorize or recategorize pages in bulk, find-and-replace select content from pages at will, message users, or generate lists of member pages belonging to categories or namespaces. In addition to providing a listing of loose pages, users may also input the names of [categories](https://www.mediawiki.org/wiki/Help:Categories) or [namespaces](https://www.mediawiki.org/wiki/Help:Namespaces) to edit their respective member pages in bulk.

As of its most recent updates, the script employs a number of other external dependencies similarly housed on Dev. In addition to those loaded by default in MediaWiki, MassEdit makes use of [Modal.js](https://dev.wikia.com/w/Modal), [Placement.js](https://dev.wikia.com/w/Placement), [I18n-js](https://dev.wikia.com/w/I18n-js), and [wgMessageWallsExist](https://dev.wikia.com/w/WgMessageWallsExist) for the purposes of standardizing modal design and providing more widespread [i18n](https://en.wikipedia.org/wiki/Internationalization_and_localization) support.

#### Resources ####

* [Documentation](https://dev.wikia.com/w/MassEdit)
* [Revision history](https://dev.wikia.com/w/MediaWiki:MassEdit/code.js?action=history)
* [Production code (JS)](https://dev.wikia.com/w/MediaWiki:MassEdit/code.js)
* [Production code (JSON)](https://dev.wikia.com/w/MediaWiki:Custom-MassEdit/i18n.json)