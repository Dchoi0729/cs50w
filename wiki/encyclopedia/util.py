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

    # Add white space to end
    content = content + "\\n"

    # <h2> tags: Replace subtitleheader (#xxx\n -> <h2>xxx</h2>\n)
    content = re.sub(r"\#{2}(.*?)\\n", r"<h2>\1</h2>\\n", content)

    # <h1> tags: Replace header (#xxx\n -> <h1>xxx</h1>\n)
    content = re.sub(r"\#{1}(.*?)\\n", r"<h1>\1</h1>\\n", content)

    # <b> tags: Replace bold words (**xxx** -> <strong>xxx</strong>)
    content = re.sub(r"\*{2}(.*?)\*{2}",r"<strong>\1</strong>", content)

    # <em> tags: Replace italicized words (*xxx* -> <em>xxx</em>)
    content = re.sub(r"\*{1}([^\s]+)\*{1}",r"<em>\1</em>", content)

    # <ul> <li> tags: Replace the start and end of list (\n*xxx\n\n -> <ul><li>xxx</li></ul>)
    content = re.sub(r"\\n\*(.*?)\\n\\n",r"<ul><li>\1</li></ul>\\n", content)

    # <p> tags: Replace new lines for paragraphs (\nxxx\n -> <p>xxx</p>)
    content = re.sub(r"\\n([^\\].*?)\\n",r"<p>\1</p>", content)
    
    # <li> tags: Replace the list elements in between 
    content = re.sub(r"<p>\*","</li> <li>", content)
    content = re.sub(r"</p>\*","</li> <li>", content)

    # <a> tags: Replace links ([x](y) -> <a href=y>x</a>)
    content = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r"<a href=\2>\1</a>", content)

    # Delete all remaining \\n tags
    content = re.sub(r"\\n", "", content)

    return content