"""
The so-called "dev" script, along with the directory of the same name, serves to
both deploy new changes housed on the author's development Git repository to the
production files on the Fandom Developers Wiki and pull changes committed on the
Dev wiki to the Git repo.
"""

__author__ = "Andrew Eissen"
__version__ = "1.0"

import configparser
import json
import requests
import sys

import dev.api as api
import dev.util as util


def main():
    """
    In accordance with best practices, the ``main`` function serves as the
    central coordinating function of the script, handling all user input,
    calling all helper functions, catching all possible generated exceptions,
    and posting results to the specific text IOs as expected. Comments below
    provide more detailed insights into the nature of the operations performed.
        :return: None
    """

    # Grab the local i18n file containing all possible console messages
    i18n_file = util.get_json_file("dev/data/i18n.json")

    # Acquire messages in language endemic to user's computer
    try:
        lang = i18n_file[util.determine_system_language()]
    except KeyError:
        # If requested language doesn't exist in i18n, default to English
        lang = i18n_file["en"]

    # Grab any extant included command line arguments
    argv = ([], list(filter(None, sys.argv[1:])))[len(sys.argv) > 1]

    try:
        # Grab user's intended action, push to Fandom file or pull from file
        action = argv[0]
    except IndexError:
        action = util.prompt_for_value(lang["p_action"])

    # Only push and pull are supported at present
    if action != "pull" and action != "push":
        util.log_msg(lang["e_action"], sys.stderr)
        sys.exit(1)

    try:
        # Link to the file from which to pull or to which to push
        mwurl = argv[1]
    except IndexError:
        mwurl = util.prompt_for_value(lang["p_mwurl"])

    # Only Fandom wikis are supported as wiki-side locations
    if not util.is_fandom_wiki_url(mwurl):
        util.log_msg(lang["e_mwurl"], sys.stderr)
        sys.exit(1)

    try:
        # File in repo to be used as source or replaced by content from file
        local_path = argv[2]
    except IndexError:
        local_path = util.prompt_for_value(lang["p_local_path"])

    try:
        # Grab contents as a means of checking if the local file exists
        local_file_contents = util.get_file_contents(local_path)
    except FileNotFoundError:
        util.log_msg(lang["e_local_path"], sys.stderr)
        sys.exit(1)

    try:
        # Check if settings.ini file is present
        (parser := configparser.ConfigParser()).read("settings.ini")
        credentials = parser["DEFAULT"].values()
    except KeyError:
        # Prompt for manual inclusion if not
        if sys.stdin.isatty():
            util.log_msg(lang["p_intro"], sys.stdout)
            credentials = [arg.rstrip() for arg in sys.stdin.readlines()]
        else:
            sys.exit(1)

    # Remove any empty strings from the outset to catch empty input
    credentials = list(filter(None, credentials))

    # Unpack the input list
    username, password = credentials

    # New requests.Session object
    session = requests.Session()

    # Link to wiki's api.php resource
    api_php = util.build_api_php_url(mwurl)

    # Fandom login flag
    is_logged_in = False

    try:
        # Log in, catching bad credentials in the process
        is_logged_in = api.login(username, password, api_php, session)
    except (requests.exceptions.HTTPError, json.decoder.JSONDecodeError):
        util.log_msg(lang["e_login_api"], sys.stderr)
    except (AssertionError, KeyError):
        util.log_msg(lang["e_login"], sys.stderr)
    finally:
        # Only proceed with main script if logged in and in right groups
        if is_logged_in:
            util.log_msg(lang["s_login"], sys.stdout)
        else:
            sys.exit(1)

    # Grab file name from URL (https://eizen.fandom.com/wiki/Test -> Test)
    mediawiki_file_name = util.get_mediawiki_page_name(mwurl)

    # Pull requests, pulling content from Fandom to local repo
    if action == "pull":
        try:
            # Try to grab contents of MediaWiki file on Fandom wiki
            mediawiki_file_contents = api.get_revision_content(
                api_php, mediawiki_file_name, session)
        except (requests.exceptions.HTTPError, json.decoder.JSONDecodeError):
            util.log_msg(lang["e_get_content_api"], sys.stderr)
            sys.exit(1)
        except (AssertionError, KeyError):
            util.log_msg(lang["e_get_content"], sys.stderr)
            sys.exit(1)

        # Flag to keep track of success of file writing of new content
        is_written = False
        try:
            # Determine if some content was successfully written
            is_written =\
                util.write_to_file(mediawiki_file_contents, local_path) > 0
        except IOError:
            util.log_msg(lang["e_write_to_file"], sys.stderr)
        finally:
            if is_written:
                util.log_msg(lang["s_write_to_file"], sys.stdout)
            else:
                sys.exit(1)

    # Push requests, pushing updates from local repo to Fandom MediaWiki file
    elif action == "push":

        # Flag to keep track of a successful POST request to Action API
        is_posted = False
        try:
            # Query action=edit endpoint of MW Action API
            is_posted = api.post_new_content(
                api_php, local_file_contents, mediawiki_file_name, session)
        except (requests.exceptions.HTTPError, json.decoder.JSONDecodeError):
            util.log_msg(lang["e_post_content_api"], sys.stderr)
        except (AssertionError, KeyError):
            util.log_msg(lang["e_post_content"], sys.stderr)
        finally:
            if is_posted:
                util.log_msg(lang["s_post_content"], sys.stdout)
            else:
                sys.exit(1)


if __name__ == "__main__":
    main()
