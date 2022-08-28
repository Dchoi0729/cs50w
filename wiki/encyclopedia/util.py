import re

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


def list_entries():
    """
    Returns a list of all names of encyclopedia entries.
    """
    _, filenames = default_storage.listdir("entries")
    return list(sorted(re.sub(r"\.md$", "", filename)
                for filename in filenames if filename.endswith(".md")))


def save_entry(title, content):
    """
    Saves an encyclopedia entry, given its title and Markdown
    content. If an existing entry with the same title already exists,
    it is replaced.
    """
    filename = f"entries/{title}.md"
    if default_storage.exists(filename):
        default_storage.delete(filename)
    default_storage.save(filename, ContentFile(content))


def get_entry(title):
    """
    Retrieves an encyclopedia entry by its title. If no such
    entry exists, the function returns None.
    """
    try:
        f = default_storage.open(f"entries/{title}.md")
        return f.read().decode("utf-8")
    except FileNotFoundError:
        return None

def decode_markdown(content):
    """
    Given a string of content, function returns the html
    friendly version of the Markdown content
    """
    content = content[1:len(content)-1]
    
    # Standardize all line spacings
    content = content.replace("\\r\\n", "\\n")

    # <h2> tags: Replace subtitleheader
    content = re.sub(r"\#{2}(.*?)\\n", r"<h2>\1</h2>", content)

    # <h1> tags: Replace header
    content = re.sub(r"\#{1}(.*?)\\n", r"<h1>\1</h1>", content)

    # <b> tags: Replace bold words
    content = re.sub(r"\*{2}(.*?)\*{2}",r"<strong>\1</strong>", content)

    # <em> tags: Replace italicized words
    content = re.sub(r"\*{1}([^\s]+)\*{1}",r"<em>\1</em>", content)

    # <ul> <li> tags: Replace the start and end of list
    content = re.sub(r"\\n\*(.*?)\\n\\n",r"<ul><li>\1</li></ul>", content)

    # <p> tags: Replace new lines for paragraphs
    content = re.sub(r"\\n(.*?)\\n",r"<p>\1</p>", content)
    
    # <li> tags: Replace the list elements in between
    content = re.sub(r"<p>\* | </p>\*","</li> <li>", content)

    # <a> tags: Replace links
    content = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r"<a href=\2>\1</a>", content)

    return content