from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django import forms

from . import util

import random
import markdown2


class NewPageForm(forms.Form):
    title = forms.CharField(label="Title", widget=forms.TextInput(attrs={'placeholder': 'Title'}))
    content = forms.CharField(label="Content", widget=forms.Textarea(attrs={'placeholder': 'Type in your content here'}))

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })


def entry(request, name):
    entry = util.get_entry(name)
    if entry:
        return render(request, "encyclopedia/entry.html", {
            "name" : name,
            "b" : repr(entry).replace("\\r\\n", "\\n"),
            "a" : util.decode_markdown(repr(entry)),
            "entry" : markdown2.markdown(entry)
        })
    else:
        return render(request, "encyclopedia/apology.html", {
            "message" : f"Sorry...but a \"{name}\" page does not exist"
        })

def search(request):
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
    if request.method == "POST":
        form = NewPageForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"]
            content = form.cleaned_data["content"]

            if title in util.list_entries():
                return render(request, "encyclopedia/apology.html", {
                    "message": f"A '{title}' page already exists!"
                })
            else:
                util.save_entry(title, content)
                return HttpResponseRedirect((reverse("entry", kwargs={"name": title})))

        else:
            return render(request, "encyclopedia/new.html", {
                    "form" : form
            })

    return render(request, "encyclopedia/new.html", {
        "form" : NewPageForm()
    })

def random_page(request):
    entries = util.list_entries()
    index = random.randint(0, len(entries)-1)
    return HttpResponseRedirect((reverse("entry", kwargs={"name": entries[index]})))

def edit(request, name):
    if request.method == "POST":
        content = request.POST["content"]
        util.save_entry(name, content)
        return HttpResponseRedirect((reverse("entry", kwargs={"name": name})))
    else:
        return render(request, "encyclopedia/edit.html", {
            "name" : name,
            "content" : util.get_entry(name)
        })