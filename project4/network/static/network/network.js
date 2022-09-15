document.addEventListener('DOMContentLoaded', function() {
    // Make sure static js is working
    console.log('hi');

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
        div.innerHTML = post['content'] + ' ' + post['date'];

        document.getElementById('posts').append(div);
      })
  });
}
