"""
The ``util`` module is used to contain utility functions and classes that have
practical utility within the context of this application but which could
conceivably be co-opted to serve in a different context for a different
application if needed. As such, there are no hardcoded magic numbers or any such
application-specific logic that might hinder their porting to a different
package or program.
"""

__all__ = [
    "build_api_php_url",
    "determine_system_language",
    "get_file_contents",
    "get_json_file",
    "is_fandom_wiki_url",
    "log_msg",
    "pretty_print",
    "prompt_for_value",
    "write_to_file"
]
__author__ = "Andrew Eissen"
__version__ = "1.0"

import ctypes
import json
import locale
import os
import sys
import urllib.parse


def build_api_php_url(fandom_url):
    """
    The ``build_api_php_url`` helper function is used to construct a well-formed
    link to a Fandom wiki's ``api.php`` resource, the primary mechanism by which
    external interactions with the MediaWiki Action API are mediated. It makes
    use of ``urllib.parse`` to parse the URL and assemble it according to the
    given schema.
        :param fandom_url: A link to a page or a resource on a Fandom wiki, i.e.
            ``https://eizen.fandom.com/wiki/User:Eizen``
        :return: A formatted URI scheme linking to the ``api.php`` resource on
            the specified wiki (i.e., ``https://eizen.fandom.com/api.php``
    """
    return "{uri.scheme}://{uri.netloc}/api.php".format(
        uri=urllib.parse.urlparse(fandom_url.strip(" ")))


def determine_system_language():
    """
    The (admittedly janky) ``determine_system_language`` function is used to
    detect and determine the system language being used on the computer running
    the application. As this differs for Windows and UNIX-based operating
    systems, two approaches are used, though if the operating system is not
    "nt" (Windows) or "posix" (Linux/Mac OS), the language code "en" is returned
    by default for English.
        :return: A two-character string representing the abbreviation of the
            detected system language ("en" for "en_US" and "en_UK", etc.)
    """
    if os.name == "nt":
        windll = ctypes.windll.kernel32.GetUserDefaultUILanguage()
        return locale.windows_locale[windll].split("_")[0]
    elif os.name == "posix":
        return locale.getdefaultlocale()[0].split("_")[0]
    else:
        return "en"


def get_file_contents(file_path):
    """
    The ``get_file_contents`` function is a simple helper function used to grab
    and extract the contents of a file specified in the ``file_path`` parameter
    as a string for use in pushing file changes to a Fandom page.
        :param file_path: A path to the target file from which to extract the
            desired contents as a string
        :return: A string representing the acquired contents of the file in
            question
    """
    with open(file_path, "rb") as file:
        return file.read().decode("UTF-8")


def get_mediawiki_page_name(file_url):
    """
    As its name implies, ``get_mediawiki_page_name`` is used to divine the name
    of the page to which the formal parameter ``file_url`` points from the URL
    itself, albeit in a semi-janky manner. It basically returns the value of the
    JavaScript ``window`` variable ``wgPageName``.
        :param file_url: The URL of the desired file resource from which to
            extract the name of the page (essentially, the value of the JS
            window variable ``wgPageName``
        :return: The name of the page as derived from the URL; for example,
            ``Test`` from ``https://eizen.fandom.com/wiki/Test``
    """
    return urllib.parse.urlparse(file_url.strip(" ")).path.split("/wiki/")[1]


def get_json_file(filename):
    """
    The ``get_json_file`` function is a simple helper function that serves to
    open, load, and return the contents of the JSON file indicated in the input
    ``filename`` formal parameter.
        :param filename: A string indicating the location and name of the
            desired JSON file to open
        :return: The contents of the indicated JSON file are returned for
            subsequent usage
    """
    with open(filename, "r") as jf:
        return json.load(jf)


def is_fandom_wiki_url(url):
    """
    The ``is_fandom_wiki_base_url`` helper function is used to determine whether
    a given URL has a base URL address corresponding to one of the permissible
    Wikia/Fandom domains, namely, ``wikia.org`` and ``fandom.com``. The formal
    parameter, ``url``, is expected to be a base URL, and its subdomain (if any)
    is popped off prior to comparison. A boolean is returned as the return value
    indicating whether the domain of the parameter matches one of the
    Wikia/Fandom default domains.
        :param url: A string representing the desired URL for which the function
            will check its base address for compliance with a ``wikia.org`` or
            ``fandom.com`` domain.
        :return: A boolean representing whether the parameter url's base address
            is ``wikia.org`` or ``fandom.com`` is returned
    """
    parsed = urllib.parse.urlparse(url.strip(" "))

    # "eizen.fandom.com" -> ["eizen", "fandom", "com"]
    domain = parsed.netloc.split(".")

    # ["eizen", "fandom", "com"] -> ["fandom", "com"]
    domain.pop(0)

    # ["fandom", "com"] -> "fandom.com"
    domain = ".".join(domain)

    return domain in ["fandom.com", "wikia.org"]


def log_msg(message_text, text_io=sys.stdout):
    """
    The ``log_msg`` function is simply used to log a message in the console
    (expected) using either the ``sys.stdout`` or ``sys.stderr`` text IOs. It
    was intended to behave much alike to the default ``print`` function but with
    a little more stylistic control.
        :param message_text: A string representing the intended message to print
            to the text IO
        :param text_io: An optional parameter denoting which text IO to which to
            print the ``message_text``. By default, this is ``sys.stdout``.
        :return: None
    """
    text_io.write(f"{message_text}\n")
    text_io.flush()


def pretty_print(json_data):
    """
    The ``pretty_print`` function is used simply to "pretty print" JSON response
    data in the console in a readable, understandable manner, similar to the
    "pretty print" functionality available in most browser consoles. This
    particular implementation of such functionality uses the ``json`` module's
    ``dump`` function to print the data, setting the indent to the author's
    preferred two-space indent and keeping keys unsorted and listed in the order
    in which they were generated.
        :param json_data: A JSON object for display in the console. The data is
            rendered unordered with two-space indent
        :return: None
    """
    log_msg(json.dumps(json_data, indent=2, sort_keys=False))


def prompt_for_value(message_text):
    """
    The ``prompt_for_value`` function is a helper function built much like
    ``log_msg`` that serves to handle any necessary user input prompts related
    to the acquisition of data beyond the settings config included in the
    ``settings.ini`` file or info passed via command line arguments at program
    initialization.
        :param message_text: A string representing the intended message to print
            to the text IO
        :return: The user input value, a string, is returned from the function
            for external assignment
    """
    sys.stdout.write(f"{message_text}: ")
    sys.stdout.flush()
    return sys.stdin.readline().rstrip()


def write_to_file(file_contents, file_path):
    """
    The ``write_to_file`` function is a simple helper function used to write the
    grabbed contents of a Fandom MediaWiki page to the file specified by the
    user in the ``file_path`` formal parameter.
        :param file_contents: String representing the content to replace the
            extant contents of the file at the ``file_path``
        :param file_path: The target file to be opened and overwritten with the
            new contents specified by ``file_contents``
        :return: The number of characters written to the given file during the
            operation
    """
    with open(file_path, "wb") as file:
        return file.write(file_contents.encode("UTF-8"))
