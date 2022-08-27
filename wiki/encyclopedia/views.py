from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse

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
    # User submitted data through search 
    if request.method == "POST":
        name = request.POST["q"]
        entry = util.get_entry(name)
        if entry:
            return HttpResponseRedirect((reverse("entry", kwargs={"name": name})))
        else:
            entry_list = util.list_entries()
            entry_list_filtered = filter(lambda entry: name in entry, entry_list)
            return render(request, "encyclopedia/search.html",{
                "query" : name,
                "entries" : list(entry_list_filtered)
            })

    return render(request, "encyclopedia/search.html",{
        "name" : "TODO"
    })

def new(request):
    return render(request, "encyclopedia/new.html", {
        "message" : "TODO"
    })