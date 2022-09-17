document.addEventListener('DOMContentLoaded', function() {
    // Make sure static js is working
    console.log('9/17-2!!');

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
        document.getElementById('posts').append(div);
        
        load_post(post);
      })
  });
}


// Load post content in post div container
function load_post(post, reload=false){
  if(reload){
    console.log('load')
    fetch(`/post/${post['id']}`)
    .then(response => response.json())
    .then(result => {
      post = result
      load_post_content(post);
    })
  }else{
    load_post_content(post);
  }
}


// Load post content
function load_post_content(post){
  let container = document.getElementById(post['id']);
  container.innerHTML = '';

  let header = document.createElement('div');
  header.setAttribute('class', 'post-header');
  header.setAttribute('id', `header-${post['id']}`);
  header.innerHTML = `
  <img src="${post['pic']}" class="post-profile-pic">
  <a class="post-username" href="/profile/${post['user']}">${post['user']}</a>
  `
  if(post['self']){
    let edit = document.createElement('span');
    edit.setAttribute('class', 'post-edit');
    edit.setAttribute('id', `edit-${post['id']}`);
    edit.innerHTML = 'edit';
    edit.addEventListener('click', (event) => editPost(event, post));
    header.append(edit);
  }

  let content = document.createElement('textarea');
  content.setAttribute('readonly', true);
  content.setAttribute('id', `content-${post['id']}`);
  content.setAttribute('class', 'post-content');
  content.innerHTML = post['content'];


  let footer = document.createElement('div');
  footer.setAttribute('class', 'post-footer');
  
  let heartIcon = document.createElement('img');
  heart_url = post['liked'] ? 'https://cdn-icons-png.flaticon.com/512/2107/2107774.png' : 'https://cdn-icons-png.flaticon.com/512/2107/2107952.png';
  heartIcon.setAttribute('src',  heart_url);
  heartIcon.setAttribute('class', 'post-heart');
  heartIcon.setAttribute('id', `heart-${post['id']}`);
  heartIcon.addEventListener('click', (event) => likePost(event, post));
  
  let likes = document.createElement('div');
  likes.setAttribute('class', 'post-likes');
  likes.innerHTML = post['likes'];

  let time = document.createElement('div');
  time.setAttribute('class', 'post-time');
  time.innerHTML = post['date'];

  footer.append(heartIcon);
  footer.append(likes);
  footer.append(time);

  container.append(header);
  container.append(content);
  container.append(footer);
}


// User likes/dislikes post
function likePost(event, post){
  console.log(event.target)
  //heart_url = post['liked'] ? 'https://cdn-icons-png.flaticon.com/512/2107/2107952.png' : 'https://cdn-icons-png.flaticon.com/512/2107/2107774.png';
  //document.getElementById(`heart-${post['id']}`).setAttribute('src', heart_url)

  fetch(`/post/${post['id']}`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'toggle-like',
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    load_post(post, reload=true);
  })
}


// User edits post
function editPost(event, post){
  let header = document.getElementById(`header-${post['id']}`);
  
  let content = document.getElementById(`content-${post['id']}`);
  content.readOnly= false;
  content.autofocus= true;

  saveButton = document.createElement('button');
  saveButton.innerHTML = 'save';
  saveButton.setAttribute('class', "btn btn-primary save-edit");
  saveButton.addEventListener('click', () => {
    fetch(`/post/${post['id']}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'edit-content',
        content: content.value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_post(post, reload=true);
    })
  })
  
  header.append(saveButton);
  
  let edit = document.getElementById(`edit-${post['id']}`);
  edit.style.display = 'none';


}