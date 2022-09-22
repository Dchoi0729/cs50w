document.addEventListener('DOMContentLoaded', function() { 
  console.log('9/22-2!!');

  const currPath = getCurrPath();

  // If user is on index path, add event listener for submission form
  if(currPath === 'index'){
    if(isLoggedIn === 'True'){
      addPostForm();
    }
  }

  // If user is on profile page, load profile contents
  if(currPath === "profile"){
    (async () => {
      data = await loadProfileData();
      if(!data['self']){
        if(isLoggedIn === 'True'){
          addFollowButton(data['isFollowing']);
        }
      }
      else{
        addUserSetting(data['bio']);
      }
      loadProfile(data);
    })()  
  }

  // Load posts for given path
  loadAllPosts(currPath);
});


// Returns as a string the current page the user is on
function getCurrPath(){
  if(location.pathname.split('/')[1] === ''){
    return 'index'
  }
  else{
    return location.pathname.split('/')[1]
  }
}


// Makes POST API call to create a new post
function addPostForm(){
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
        loadAllPosts('index');
        document.getElementById('post-form-content').value = "";
      }else{
        document.getElementById('post-form-error').innerHTML = `(${result['error']})`;
      }
    })
    return false;
  }
}


// Makes GET API call and returns profile data
async function loadProfileData(){
  const response = await fetch(`/profile-info/${location.pathname.split('/')[2]}`)
  return response.json()
}


// Add follow button to profile page
function addFollowButton(isFollowing){
  let followButton = document.createElement('button');
  followButton.setAttribute('id', 'profile-follow');
  followButton.setAttribute('class', 'btn btn-primary');
  followButton.innerHTML = isFollowing ? 'Unfollow' : 'Follow';
  let div = document.getElementById('profile-description');
  div.insertBefore(followButton, div.children[1]);
  followButton.addEventListener('click', () => {
    fetch(`/profile-info/${location.pathname.split('/')[2]}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'toggle-follow',
      })
    })
    .then(response => response.json())
    .then(result => {
      loadProfile();
    })
  })
}


// Makes picture and bio editable if current user matches the profile user
function addUserSetting(bioContent){
  let pic = document.getElementById('profile-img');
  pic.setAttribute('class', 'profile-me');
  pic.setAttribute('data-toggle', 'modal');
  pic.setAttribute('data-target', '#picModal');

  let bio = document.getElementById('profile-bio');
  bio.setAttribute('class', 'profile-me');
  bio.setAttribute('data-toggle', 'modal');
  bio.setAttribute('data-target', '#bioModal');
  let newBio = document.getElementById('newBio');
  newBio.innerHTML = bioContent;

  let photoButton = document.getElementById('edit-photo-button');
  photoButton.addEventListener('click', () => {
    const newUrl = document.getElementById('newPhoto');
    fetch(`/profile-info/${location.pathname.split('/')[2]}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'edit-photo',
        url: newUrl.value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      loadProfile();
      loadAllPosts('profile');
    })
    newUrl.value = '';
  })

  let bioButton = document.getElementById('edit-bio-button');
  bioButton.addEventListener('click', () => {
    fetch(`/profile-info/${location.pathname.split('/')[2]}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'edit-bio',
        bio: newBio.value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      loadProfile();
    })
  })
}


// Load profile contents into the correct place in profile page
async function loadProfile(data=''){
  if(data === ''){
    data = await loadProfileData();
  }
  document.getElementById('profile-name').innerHTML = data['name'];
  document.getElementById('profile-img').setAttribute('src', data['pic']);
  document.getElementById('profile-bio').innerHTML = data['bio'];
  
  let infoBar = document.getElementById('profile-info');
  infoBar.innerHTML = `
  <div class="col-sm-4 mx-auto center-block text-center">posts<br>${data['postCount']}</div>
  <div class="col-sm-4 mx-auto center-block text-center">followers<br>${data['followers']}</div>
  <div class="col-sm-4 mx-auto center-block text-center">following<br>${data['following']}</div>
  `

  if(!data['self']){
    if(isLoggedIn === 'True'){
      let followButton = document.getElementById('profile-follow');
      followButton.style.display = data['self'] ? 'none' : 'block';
      followButton.innerHTML = data['isFollowing'] ? 'Unfollow' : 'Follow';
    }
  }
}


// Loads all the posts and for the current page
// By default loads the first page of posts
function loadAllPosts(path, currPage=1){
  document.getElementById('posts').innerHTML = '';
  let totalPage = 0;

  if(path === 'profile'){
    path = `profile-${location.pathname.split('/')[2]}`
  }
  fetch(`/posts/${path}?page=${currPage}`)
  .then(response => response.json())
  .then(posts => {
    posts.forEach(post => {
      if(post['id']){/*
        let div = document.createElement('div');
        div.setAttribute('class', 'post-container')
        div.setAttribute('id', post['id']);
        document.getElementById('posts').append(div);
        */
        
        loadPost(post);
      }else{
        totalPage = post['total_page']
      }

    })
    if(totalPage > 1){
      addPaginator(currPage, totalPage);
    }
  });
}


// Add paginator nav bar at the bottom of the page
function addPaginator(currPage, totalPage){
  let paginationContainer = document.getElementById('pagination-container');
  paginationContainer.innerHTML = ''

  let paginationList = document.createElement('ul');
  paginationList.setAttribute('class', 'pagination');

  if(currPage > 2){
    paginationList.append(createPaginationIcon(false, 1));
  }
  if(currPage > 3){
    paginationList.append(createPaginationIcon(false, '...', breaker=true));
  }
  if(currPage > 1){
    paginationList.append(createPaginationIcon(false, currPage - 1));
  }
  paginationList.append(createPaginationIcon(true, currPage));
  if(currPage + 1 <= totalPage){
    paginationList.append(createPaginationIcon(false, currPage + 1));
  }
  if(currPage + 2 < totalPage){
    paginationList.append(createPaginationIcon(false, '...', breaker=true));
  }
  if(currPage + 1 < totalPage){
    paginationList.append(createPaginationIcon(false, totalPage));
  }
  paginationContainer.appendChild(paginationList);
}


// Helper function that creates and returns pagination button
function createPaginationIcon(isCurrent, content, breaker=false){
  let li = document.createElement('li')
  let button = document.createElement('button');
  if(!breaker){
    li.setAttribute('class', isCurrent ? 'page-item active' : 'page-item');
    if(isCurrent){
      li.setAttribute('aria-current', 'page');
    }
    button.addEventListener('click', () => loadAllPosts(getCurrPath(), currPage=content));
  }else{
    li.setAttribute('class', 'page-item disabled');
  }
  button.setAttribute('class', 'page-link');
  button.innerHTML = content;
  li.append(button);

  return li;
}


// Makes GET API call and returns data for post with given id
async function loadPostData(id){
  const response = await fetch(`/post/${id}`)
  return response.json()
}


// Loads data for post and appends post div into container
// If post already exists, updates that post with up to date info
async function loadPost(post, reload=false){
  console.log('hi')
  if(reload){
    post = await loadPostData(post['id'])
  }
  let container = document.getElementById(post['id']);
  const newPost = container == null;
  //container.innerHTML = '';
  if(newPost){
    container = document.createElement('div');
    container.setAttribute('class', 'post-container')
    container.setAttribute('id', post['id']);
  }else{
    container.innerHTML = '';
  }

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
    edit.addEventListener('click', () => editPostContent(post));
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
  const heartUrl = post['liked'] ? 'https://cdn-icons-png.flaticon.com/512/2107/2107774.png' : 'https://cdn-icons-png.flaticon.com/512/2107/2107952.png';
  heartIcon.setAttribute('src',  heartUrl);
  heartIcon.setAttribute('class', isLoggedIn === 'True' ? 'post-heart active' : 'post-heart');
  heartIcon.setAttribute('id', `heart-${post['id']}`);
  if(isLoggedIn === 'True'){
    heartIcon.addEventListener('click', () => likePost(post));
  }

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

  if(newPost){
    document.getElementById('posts').append(container);
  }
}


// Make POST API call to update likes/dislikes for given post
function likePost(post){
  fetch(`/post/${post['id']}`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'toggle-like',
    })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    loadPost(post, reload=true);
  })
}


// Make POST API call to update content for given post or remove content
function editPostContent(post){
  let header = document.getElementById(`header-${post['id']}`);
  
  let content = document.getElementById(`content-${post['id']}`);
  content.readOnly= false;

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
      loadPost(post, reload=true);
    })
  })
  header.append(saveButton);

  let trash = document.createElement('img');
  trash.setAttribute('src' , 'https://cdn-icons-png.flaticon.com/512/1214/1214428.png');
  trash.setAttribute('class', 'post-trash');
  trash.addEventListener('click', (event) => {    
    // Add animation to make the deleted div go away
    const element = event.target;
    element.parentElement.parentElement.style.animationPlayState = 'running';
    element.parentElement.parentElement.addEventListener('animationend', () => {
      element.parentElement.parentElement.remove();
    })

    const postArr = document.querySelectorAll('.post-container')
    
    // TODO: Make pagination bar at the bottom change
    fetch(`/post/${post['id']}`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'delete',
        lastPost: postArr[postArr.length-1].id
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      loadPost(result[0]);
      // Edit post count number here;
    })
  })
  header.append(trash);
  
  let edit = document.getElementById(`edit-${post['id']}`);
  edit.style.display = 'none';
}