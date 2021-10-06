"""
The `api` module contains a number of general functions that permit external
scripts to interact and interface with the MediaWiki Action API (typically found
at `api.php`) and/or the Fandom Nirvana/Services API without having to make
`GET` and `POST` requests directly. Likewise, the module's functions all handle
the validation and collation of data from query responses themselves, either
raising exceptions or performing computed member access to return the necessary
values for calling functions.
"""

__all__ = [
    "get_revision_content",
    "login",
    "post_new_content"
]
__author__ = "Andrew Eissen"
__version__ = "0.1"

import requests


def _get_csrf_token(api_php, session=None):
    """
    This private function is responsible for acquiring a Cross-Site Request
    Forgery (CSRF) token from the "``tokens``" MediaWiki API endpoint as one
    of the required parameters for all ``POST`` requests made by the
    application. In JavaScript, this token may be acquired simply from
    ``mw.user.tokens.get("editToken")``, but a separate query must be made
    by off-site applications like this one for the purposes of token
    acquisition.
        :param api_php: The full URL pointing to the MediaWiki Action API
            `api.php` resource
        :param session: An optional `requests.Session` object. If no session is
            passed, a new `requests.Session` is instantiated for the function.
        :return token: A string login token retrieved from the API for use
            in the class's ``POST``ing methods if successful.
    """

    request = (session or requests.Session()).get(url=api_php, params={
        "action": "query",
        "meta": "tokens",
        "format": "json"
    })

    # May throw requests.exceptions.HTTPError
    request.raise_for_status()

    # May throw JSONDecodeError
    data = request.json()

    # May throw AssertionError
    assert ("errors" not in data)

    # May throw KeyError
    token = data["query"]["tokens"]["csrftoken"]

    return token


def _get_login_token(api_php, session=None):
    """
    This private function is used to retrieve a login token from the
    MediaWiki API for use in external, offsite editing/querying. It is used
    in the initial login process by the ``login`` method in conjunction with
    a bot username and password to authenticate the application.
        :param api_php: The full URL pointing to the MediaWiki Action API
            `api.php` resource
        :param session: An optional `requests.Session` object. If no session is
            passed, a new `requests.Session` is instantiated for the function.
        :return token: A string login token retrieved from the API for use
            in the ``login`` method if successful.
    """

    request = (session or requests.Session()).get(url=api_php, params={
        "action": "query",
        "meta": "tokens",
        "type": "login",
        "format": "json"
    })

    # May throw requests.exceptions.HTTPError
    request.raise_for_status()

    # May throw JSONDecodeError
    data = request.json()

    # May throw AssertionError
    assert ("errors" not in data)

    # May throw KeyError
    token = data["query"]["tokens"]["logintoken"]

    return token


def get_revision_content(api_php, page, session=None):
    request = (session or requests.Session()).get(url=api_php, params={
        "action": "query",
        "prop": "revisions",
        "titles": page,
        "rvslots": "*",
        "rvprop": "content",
        "formatversion": 2,
        "format": "json"
    })

    # May throw requests.exceptions.HTTPError
    request.raise_for_status()

    # May throw JSONDecodeError
    data = request.json()

    # May throw AssertionError
    assert ("errors" not in data)

    # May throw KeyError
    content =\
        data["query"]["pages"][0]["revisions"][0]["slots"]["main"]["content"]

    return content


def login(username, password, api_php, session=None):
    """
    The ``login`` function, as the name implies, is used as the primary
    means by which the user logs into the wiki. This function will not
    return a ``True`` status boolean if the user attempts to pass his own
    user account password as the value of the formal parameter of the same
    name; a bot password retrieved from the wiki's ``Special:BotPasswords``
    generator will need to be used for login attempts to succeed.
        :param username: A string representing the username of the user
            employing the application
        :param password: The bot password of the user employing the script,
            obtained from the wiki's ``Special:BotPasswords`` generator
        :param api_php: The full URL pointing to the MediaWiki Action API
            `api.php` resource
        :param session: An optional `requests.Session` object. If no session is
            passed, a new `requests.Session` is instantiated for the function.
        :return: A status boolean indicating whether the login attempt was
            successful is returned as the return value
    """

    session = session or requests.Session()
    request = session.post(api_php, data={
        "action": "login",
        "lgname": username,
        "lgpassword": password,
        "lgtoken": _get_login_token(api_php, session),
        "format": "json"
    })

    # May throw requests.exceptions.HTTPError
    request.raise_for_status()

    # May throw JSONDecodeError
    data = request.json()

    # May throw AssertionError
    assert ("errors" not in data)

    # May throw KeyError
    is_successful = data["login"]["result"] == "Success"
    is_right_user = data["login"]["lgusername"] == username

    # Login only occurs if the request succeeds and username matches
    return is_successful and is_right_user


def post_new_content(api_php, content, page, session=None):
    session = session or requests.Session()
    request = session.post(api_php, data={
        "action": "edit",
        "token": _get_csrf_token(api_php, session),
        "title": page,
        "summary": "",
        "text": content,
        "format": "json"
    })

    # May throw requests.exceptions.HTTPError
    request.raise_for_status()

    # May throw JSONDecodeError
    data = request.json()

    # May throw AssertionError
    assert ("errors" not in data)

    # May throw KeyError
    return data["edit"]["result"] == "Success"
