document.addEventListener('DOMContentLoaded', function() {
  // Make sure static js is working
  console.log('bye');

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Compose and send email
  document.getElementById('compose-form').onsubmit = () => {
    const recipients = document.getElementById('compose-recipients').value;
    const subject = document.getElementById('compose-subject').value;
    const body = document.getElementById('compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject, 
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      if(!result['error']){
        load_mailbox('sent');
      }else{
        const element = document.createElement('li');
        element.innerHTML = result['error'];
        document.getElementById('compose-error').append(element);
      }
    })
    return false;
  }
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Clear existing child elements of emails-view
  document.getElementById('emails-view').innerHTML = '';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Render appropriate mailbox
  load_emails(mailbox);
}

function load_emails(mailbox){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
        let div = document.createElement('div');
        div.setAttribute('class', email['read'] ? 'email read':'email');
        div.setAttribute('id', email['id']);
        div.innerHTML = 
        `<h3 class='email-sender'>${email['sender']}</h3>
        <h3 class='email-subject'>${email['subject']}</h3>
        <h3 class='email-time'>${email['timestamp']}</h3>
        `;
        
        div.addEventListener('click', load_email);

        document.getElementById('emails-view').append(div);
      })
  });
}

function load_email(event){
  const mailbox = document.getElementById('emails-view').firstChild.innerHTML;

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Clear existing child elements of email-view
  document.getElementById('email-view').innerHTML = '';

  const id = event.target.id;

  // Retrieve and add email that triggered the click event
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);

    let container = document.createElement('div');
    container.innerHTML = `
    <div> <strong>From:</strong> ${email['sender']}</div>
    <div> <strong>To:</strong> ${email['recipients']}</div>
    <div> <strong>Subject:</strong> ${email['subject']}</div>
    <div> <strong>Timestamp:</strong> ${email['timestamp']}</div>
    `;

    let reply = document.createElement('button');
    reply.setAttribute('class', 'btn btn-sm btn-outline-primary');
    reply.setAttribute('id', 'button-reply');
    reply.innerHTML = 'Reply';
    reply.addEventListener('click', (event) => reply_email(event, email));
    container.append(reply);

    if(mailbox != "Sent"){
      let archive = document.createElement('button');
      archive.setAttribute('class', 'btn btn-sm btn-outline-primary');
      archive.setAttribute('id', 'button-archive');
      archive.innerHTML = email['archived'] ? 'Unarchive' : 'Archive';
      archive.addEventListener('click', (event) => archive_email(event, id));
      container.append(archive);
    }

    let body = document.createElement('div');
    body.innerHTML = `<hr>${email['body']}`;
    container.append(body);

    document.getElementById('email-view').append(container);
  })
  
  // Make request to alter read property of email
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}


function reply_email(event, email){
  compose_email();
  const subject = email['subject'];
  const new_subject = subject.substring(0,4) === 'Re: ' ? subject : `Re: ${subject}`;
  document.getElementById('compose-view-title').innerHTML = 'Reply Email';
  document.getElementById('compose-recipients').value = email['sender'];
  document.getElementById('compose-subject').value = new_subject;
  document.getElementById('compose-body').value = `
On ${email['timestamp']}, ${email['sender']} wrote: 
"${email['body']}"
  `
}

// Archive email
function archive_email(event, id){
  const action = event.target.innerHTML;
  
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: action === 'Archive'
    })
  })
  
  const new_text = action === 'Archive' ? 'Unarchive' : 'Archive';
  document.getElementById('button-archive').innerHTML = new_text;
  
  setTimeout(() => {load_mailbox('inbox');}, 600);
}