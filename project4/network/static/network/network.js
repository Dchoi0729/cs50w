document.addEventListener('DOMContentLoaded', function() {
    // Make sure static js is working
    console.log('bye!!');

    const curr_page = get_curr_page();
    load_posts(curr_page);

    if(curr_page === 'index'){
      document.getElementById('post-form').onsubmit = () => {
        document.getElementById('post-form-error').innerHTML = '';
        const content = document.getElementById('post-form-content').value;
    
        fetch('/posts', {
          method: 'POST',
          body: JSON.stringify({
            content: content,
          })
        })
        .then(response => response.json())
        .then(result => {
          console.log(result);
          if(!result['error']){
            load_posts(curr_page);
            document.getElementById('post-form-content').value = "";
          }else{
            document.getElementById('post-form-error').innerHTML = `(${result['error']})`;
          }
        })
        return false;
      }
    }
  });


// Returns as a string the current page the user is on
function get_curr_page(){
  if(location.pathname.split('/')[1] === ''){
    return 'index'
  }
  else{
    return location.pathname.split('/')[1]
  }
}


// Loads all the posts and appends to post div on page
function load_posts(page){
  document.getElementById('posts').innerHTML = '';

  let path = page;
  if(page==='profile'){
    path = `profile-${location.pathname.split('/')[2]}`
  }
  console.log(path);
  fetch(`/posts/${path}`)
  .then(response => response.json())
  .then(posts => {
    console.log(posts)
      posts.forEach(post => {
        let div = document.createElement('div');
        div.setAttribute('class', 'post-container')
        div.setAttribute('id', post['id']);
        //div.innerHTML = post['content'] + ' ' + post['date'] + ' ' + post['pic'];
        div.innerHTML = `
        <div>
          <img src="${post['pic']}" class="post-profile-pic">
          <a class="post-username" href="/profile/${post['user']}">${post['user']}</a>
        </div>
        <div class="post-content">
          ${post['content']}
        </div>
        `

        let footer = document.createElement('div');
        footer.setAttribute('class', 'post-footer');

        let image = document.createElement('img');
        image.setAttribute('src', 'https://cdn.pixabay.com/photo/2017/06/26/20/33/icon-2445095_960_720.png');
        // blank https://cdn.pixabay.com/photo/2017/06/26/20/33/icon-2445095_960_720.png
        // red https://cdn.pixabay.com/photo/2012/04/01/18/44/heart-23960__340.png
        image.setAttribute('class', 'post-heart');
        image.setAttribute('id', post['id']);
        image.addEventListener('click', (event) => likePost(event))
        
        let likes = document.createElement('div');
        likes.setAttribute('class', 'post-likes');
        likes.innerHTML = post['likes'];

        let time = document.createElement('div');
        time.setAttribute('class', 'post-time');
        time.innerHTML = post['date'] + '&#x2764;&#xFE0F; &#x2764;';

        footer.append(image);
        footer.append(likes);
        footer.append(time);
        div.append(footer);

        document.getElementById('posts').append(div);
      })
  });
}


// When user likes/dislikes post
function likePost(event){
  console.log(event.target)
  // make put request
  // add/subtract to the
  // https://cdn.pixabay.com/photo/2012/04/01/18/44/heart-23960__340.png

  //  &#x2764;&#xFE0F;
  //  &#9825;
  //https://pixabay.com/ko/vectors/%ec%9d%b8%ec%8a%a4-%ed%83%80-%ea%b7%b8%eb%9e%a8-%ec%9d%b8%ec%8a%a4%ed%83%80-%eb%a7%88%ec%9d%8c-3814047/
}