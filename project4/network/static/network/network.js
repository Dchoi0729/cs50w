document.addEventListener('DOMContentLoaded', function() { 
  console.log('9/19-2!!');

  const currPath = getCurrPath();

  // If user is on index path, add event listener for submission form
  if(currPath === 'index'){
    addPostForm();
  }

  // If user is on profile page, load profile contents
  if(currPath === "profile"){
    (async () => {
      data = await loadProfileData();
      if(!data['self']){
        addFollowButton(data['isFollowing']);
      }
      else{
        addUserSetting();
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
function addUserSetting(){
  let pic = document.getElementById('profile-img');
  pic.setAttribute('class', 'profile-me');
  pic.setAttribute('data-toggle', 'modal');
  pic.setAttribute('data-target', '#picModal');
  
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
      loadProfile();
      loadAllPosts('profile');
    })
    newUrl.value = '';
  })
}


// Load profile contents into the correct place in profile page
async function loadProfile(data=''){
  if(data === ''){
    data = await loadProfileData();
  }
  document.getElementById('profile-name').innerHTML = data['name'];
  document.getElementById('profile-img').setAttribute('src', data['pic']);
  
  let infoBar = document.getElementById('profile-info');
  infoBar.innerHTML = `
  <div class="col-sm-4 mx-auto center-block text-center">posts<br>${data['postCount']}</div>
  <div class="col-sm-4 mx-auto center-block text-center">followers<br>${data['followers']}</div>
  <div class="col-sm-4 mx-auto center-block text-center">following<br>${data['following']}</div>
  `

  if(!data['self']){
    let followButton = document.getElementById('profile-follow');
    followButton.style.display = data['self'] ? 'none' : 'block';
    followButton.innerHTML = data['isFollowing'] ? 'Unfollow' : 'Follow';
  }
}


// TODO: CHANGE THIS SO WE CAN PAGINATE!!!!
// Loads all the posts and appends the post divs to the current page
function loadAllPosts(path){
  document.getElementById('posts').innerHTML = '';

  if(path === 'profile'){
    path = `profile-${location.pathname.split('/')[2]}`
  }
  fetch(`/posts/${path}`)
  .then(response => response.json())
  .then(posts => {
    console.log(posts)
    posts.forEach(post => {
      let div = document.createElement('div');
      div.setAttribute('class', 'post-container')
      div.setAttribute('id', post['id']);
      document.getElementById('posts').append(div);
      
      loadPost(post);
    })
  });
}


// Makes GET API call and returns data for post with given id
async function loadPostData(id){
  const response = await fetch(`/post/${id}`)
  return response.json()
}


// Load post content in the post div container
async function loadPost(post, reload=false){
  if(reload){
    post = await loadPostData(post['id'])
    console.log('reload');
  }
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
  heartIcon.setAttribute('class', 'post-heart');
  heartIcon.setAttribute('id', `heart-${post['id']}`);
  heartIcon.addEventListener('click', () => likePost(post));
  
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


// Make POST API call to update content for given post
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
  
  let edit = document.getElementById(`edit-${post['id']}`);
  edit.style.display = 'none';
}

/*
// Load profile content page for the first time
function loadProfile_page(){
  fetch(`/profile-info/${location.pathname.split('/')[2]}`)
  .then(response => response.json())
  .then(profile => {
    document.getElementById('profile-name').innerHTML = profile['name'];
    
    let pic = document.getElementById('profile-img');
    pic.setAttribute('src', profile['pic']);
    
    let infoBar = document.getElementById('profile-info');
    infoBar.innerHTML = `
    <div class="col-sm-4 mx-auto center-block text-center">posts<br>${profile['postCount']}</div>
    <div class="col-sm-4 mx-auto center-block text-center">followers<br>${profile['followers']}</div>
    <div class="col-sm-4 mx-auto center-block text-center">following<br>${profile['following']}</div>
    `
    
    if(!profile['self']){
      let followButton = document.createElement('button')
      followButton.setAttribute('id', 'profile-follow')
      followButton.setAttribute('class', 'btn btn-primary')
      followButton.innerHTML = profile['isFollowing'] ? 'Unfollow' : 'Follow';
      let div = document.getElementById('profile-description');
      div.insertBefore(followButton, div.children[1])
      followButton.addEventListener('click', () => {
        console.log(location.pathname.split('/')[2])
        fetch(`/profile-info/${location.pathname.split('/')[2]}`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'toggle-follow',
          })
        })
        .then(response => response.json())
        .then(result => {
          console.log(result);
          loadProfile();
        })
      })
    }else{
      pic.setAttribute('class', 'profile-me');
      pic.setAttribute('data-toggle', 'modal');
      pic.setAttribute('data-target', '#picModal');
      
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
    }
  })
}

// Load post content
function loadPost_content(post){
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
    edit.addEventListener('click', (event) => editPostContent(event, post));
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
  heartUrl = post['liked'] ? 'https://cdn-icons-png.flaticon.com/512/2107/2107774.png' : 'https://cdn-icons-png.flaticon.com/512/2107/2107952.png';
  heartIcon.setAttribute('src',  heartUrl);
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
}*/