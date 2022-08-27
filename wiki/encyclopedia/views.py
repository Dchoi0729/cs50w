from django.shortcuts import render

from . import util

import markdown

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })


def entry(request, name):
    entry = util.get_entry(name)
    if entry:
        return render(request, "encyclopedia/entry.html", {
            "name" : name,
            "entry" : markdown.markdown(entry)
        })
    else:
        return render(request, "encyclopedia/apology.html", {
            "message" : f"Sorry...but a \"{name}\" page does not exist"
        })

def search(request):
    return render(request, "encyclopedia/search.html")
