from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.forms import ModelForm
from django.contrib.auth.decorators import login_required


from .models import User, Listing, Bid, Comment


class CreateListingForm(ModelForm):
    required_css_class = 'required'

    class Meta:
        model = Listing
        exclude = ["creator", "curr_price"]


class BidForm(ModelForm):
    required_css_class = 'required'

    class Meta:
        model = Bid
        exclude = ["user", "listing"]
    
    def __init__(self, *args, **kwargs):
        self.key = kwargs.pop("key")
        super(BidForm, self).__init__(*args, **kwargs)

    def clean(self):
        data = self.cleaned_data
        listing = Listing.objects.get(pk=self.key)
        bid = data.get("bid")
        
        if bid < listing.starting_bid and listing.starting_bid == listing.curr_price:
            self.add_error(None, "Bid must be as large as the starting bid" )
        if bid <= listing.curr_price and not listing.starting_bid == listing.curr_price:
            self.add_error(None, "Bid has to be greater than the current price")    
        
        return data


def index(request):
    return render(request, "auctions/index.html", {
        "page_title": "Active Listing",
        "listings": Listing.objects.order_by("time_created").reverse()
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")


@login_required
def create(request):
    if request.method == "POST":
        form = CreateListingForm(request.POST)
        listing = form.save(commit=False)
        listing.creator = request.user
        listing.curr_price = request.POST["starting_bid"]
        listing.save()
        return HttpResponseRedirect(reverse("index"))
    
    return render(request, "auctions/create.html", {
        "form" : CreateListingForm(auto_id='createform--%s')
    })


def listing(request, key):
    listing = Listing.objects.get(pk=key)
    curr_price = listing.curr_price
    
    # If user is signed in
    if request.user.is_authenticated:
        watchlist = request.user.watchlist.all()
        in_watchlist = True if listing in watchlist else False

        if request.method == "POST":
            form = BidForm(key=key, data=request.POST)

            if form.is_valid():
                bid = form.save(commit=False)
                bid.user = request.user
                bid.listing = listing
                bid.save()
                
                Listing.objects.filter(pk=key).update(curr_price=request.POST["bid"])

                return HttpResponseRedirect(reverse("listing", args=(key,)))
            else:
                return render(request, "auctions/listing.html", {
                "listing": listing,
                "in_watchlist": in_watchlist,
                "bid_form": form,
                "price": curr_price
            })

        return render(request, "auctions/listing.html", {
                "listing": listing,
                "in_watchlist": in_watchlist,
                "bid_form": BidForm(key=key),
                "price": curr_price
            })

    # Default listing page for users not signed in
    return render(request, "auctions/listing.html", {
        "listing": listing,
        "price": curr_price
    })


def watchlist(request):
    if request.method == "POST":
        key = request.POST["key"]
        listing = Listing.objects.get(pk=key)

        if request.POST["action"] == "add":
            request.user.watchlist.add(listing)

        elif request.POST["action"] == "delete":
            request.user.watchlist.remove(listing)

        return HttpResponseRedirect(reverse("listing", args=(key,)))

    return render(request, "auctions/index.html", {
        "page_title": "My Watchlist",
        "listings": request.user.watchlist.all()
    })


def get_curr_price(key):
    listing = Listing.objects.get(pk=key)

    if len(Bid.objects.filter(listing = listing)) > 0:
        last_bid = Bid.objects.filter(listing = listing).latest("time").bid
    else:
        last_bid = -1
    
    return max(listing.starting_bid, last_bid)

